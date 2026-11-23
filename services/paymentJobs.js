// CFG-01 — payment automation, split into PLAN (what would change) and APPLY (write it).
//
// The business rules are exactly those of the original services/paymentReminderService.js (unchanged):
//  • Payment arrangements (ManagedStudent.paymentPlan):
//      pm = monthly (+1 month) · trimestrial = three months (+3) · semestriel = half season (+6) ·
//      annuel = full season: never rolled over, never reminded, never marked overdue.
//  • paymentDate is the NEXT DUE DATE. "Mark as paid" sets status 'paid' (the date does not move).
//  • Roll-over: an active, paid, non-annual student whose due date is more than ONE DAY in the past becomes
//    'pending' with the due date moved by one period of their arrangement; reminder flags are reset.
//  • Overdue: an active, non-paid, non-annual student whose due date (day) is before today becomes 'overdue';
//    an 'overdue' reminder record is created unless one was created in the last 7 days.
//  • Upcoming: an active 'pending' non-annual student inside the reminder window
//    (reminderDaysBefore days before the due date, default 7) gets one 'upcoming' reminder; the flag is set.
// Added safeguards (no rule change): one reminder per student, type and payment period; every run can be
// previewed; inactive / dropped / graduated students are never touched.
const ManagedStudent = require('../models/ManagedStudent');
const PaymentReminder = require('../models/PaymentReminder');
const PaymentHistory = require('../models/PaymentHistory');
const { notifyPaymentDue } = require('./notificationService');

const PLAN_MONTHS = { pm: 1, trimestrial: 3, semestriel: 6 };

function dayStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }

// Pure calculation for one student (no database access). Returns the list of actions in order.
function planForStudent(s, now, recentOverdueReminder, upcomingReminderExists) {
    const actions = [];
    if (s.status !== 'active' || s.paymentPlan === 'annuel') return actions;
    let status = s.paymentStatus, due = new Date(s.paymentDate), reminderSent = !!s.paymentReminderSent;

    // 1. roll-over of paid students one day after their due date
    const oneDayAgo = new Date(now); oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    if (status === 'paid' && due < oneDayAgo) {
        const months = PLAN_MONTHS[s.paymentPlan || 'pm'] || 1;
        const next = addMonths(due, months);
        actions.push({ type: 'rollover', from: { status, paymentDate: due }, to: { status: 'pending', paymentDate: next }, periodMonths: months });
        status = 'pending'; due = next; reminderSent = false;
    }
    if (status === 'paid') return actions;

    // 2. overdue (compare days, not times)
    if (dayStart(now) > dayStart(due)) {
        if (status !== 'overdue') {
            actions.push({ type: 'overdue', from: { status, paymentDate: due }, to: { status: 'overdue', paymentDate: due } });
            if (!recentOverdueReminder) actions.push({ type: 'overdue_reminder', paymentDate: due });
        }
        return actions;
    }

    // 3. upcoming reminder inside the reminder window
    if (status === 'pending') {
        const remindFrom = new Date(due); remindFrom.setDate(remindFrom.getDate() - (s.reminderDaysBefore || 7));
        if (now >= remindFrom && now < due && !reminderSent && !upcomingReminderExists) {
            actions.push({ type: 'upcoming_reminder', paymentDate: due });
        }
    }
    return actions;
}

async function planPayments(now = new Date()) {
    const students = await ManagedStudent.find({ status: 'active', paymentPlan: { $ne: 'annuel' } })
        .select('fullName status paymentPlan paymentStatus paymentDate paymentAmount reminderDaysBefore paymentReminderSent groupName').lean();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const plans = [];
    for (const s of students) {
        // quick filter: nothing can happen to a paid student whose due date is not yet past
        if (s.paymentStatus === 'paid' && new Date(s.paymentDate) >= new Date(now.getTime() - 86400000)) continue;
        const recentOverdue = await PaymentReminder.exists({ student: s._id, reminderType: 'overdue', sentAt: { $gte: weekAgo } });
        const tentative = planForStudent(s, now, !!recentOverdue, false);
        const upc = tentative.find(a => a.type === 'upcoming_reminder');
        const upcomingExists = upc ? await PaymentReminder.exists({ student: s._id, reminderType: 'upcoming', paymentDate: upc.paymentDate }) : false;
        const actions = upcomingExists ? planForStudent(s, now, !!recentOverdue, true) : tentative;
        if (actions.length) {
            // For the first production run: payments already recorded for this same due date. More than one means
            // the date did not move while the jobs were not running — the Director should check before applying.
            const paymentsForThisDueDate = await PaymentHistory.countDocuments({ student: s._id, paymentDate: s.paymentDate });
            plans.push({ studentId: String(s._id), name: s.fullName, group: s.groupName || '', plan: s.paymentPlan || 'pm', amount: s.paymentAmount,
                current: { status: s.paymentStatus, paymentDate: s.paymentDate }, paymentsForThisDueDate, checkFirst: paymentsForThisDueDate > 1, actions });
        }
    }
    return plans;
}

function summarize(plans) {
    const count = t => plans.reduce((n, p) => n + p.actions.filter(a => a.type === t).length, 0);
    return { studentsAffected: plans.length, toCheckFirst: plans.filter(p => p.checkFirst).length, rollovers: count('rollover'), overdue: count('overdue'), overdueReminders: count('overdue_reminder'), upcomingReminders: count('upcoming_reminder') };
}

async function applyPayments(plans, now = new Date()) {
    const done = { rollovers: 0, overdue: 0, overdueReminders: 0, upcomingReminders: 0, errors: [] };
    for (const p of plans) {
        try {
            for (const a of p.actions) {
                if (a.type === 'rollover') {
                    // only if the student is still exactly in the planned state (idempotent, safe if run twice)
                    const r = await ManagedStudent.updateOne({ _id: p.studentId, paymentStatus: 'paid', paymentDate: a.from.paymentDate },
                        { $set: { paymentStatus: 'pending', paymentDate: a.to.paymentDate, paymentReminderSent: false, lastReminderDate: null } });
                    done.rollovers += r.modifiedCount;
                } else if (a.type === 'overdue') {
                    const r = await ManagedStudent.updateOne({ _id: p.studentId, paymentStatus: a.from.status, paymentDate: a.from.paymentDate },
                        { $set: { paymentStatus: 'overdue' } });
                    done.overdue += r.modifiedCount;
                } else if (a.type === 'overdue_reminder' || a.type === 'upcoming_reminder') {
                    const reminderType = a.type === 'overdue_reminder' ? 'overdue' : 'upcoming';
                    if (await PaymentReminder.exists({ student: p.studentId, reminderType, paymentDate: a.paymentDate })) continue;
                    await PaymentReminder.create({ student: p.studentId, studentName: p.name, paymentDate: a.paymentDate, reminderType, method: 'system', status: 'sent', notes: `Automated ${reminderType} payment reminder` });
                    if (reminderType === 'upcoming') await ManagedStudent.updateOne({ _id: p.studentId }, { $set: { paymentReminderSent: true, lastReminderDate: now } });
                    // same notification call as the original service (push is currently disabled there)
                    notifyPaymentDue(p.studentId, { paymentAmount: p.amount, paymentDate: a.paymentDate, paymentStatus: reminderType === 'overdue' ? 'overdue' : 'pending' }).catch(() => {});
                    done[a.type === 'overdue_reminder' ? 'overdueReminders' : 'upcomingReminders']++;
                }
            }
        } catch (e) { done.errors.push(`${p.name}: ${e.message}`); }
    }
    return done;
}

module.exports = { planForStudent, planPayments, applyPayments, summarize, PLAN_MONTHS };
