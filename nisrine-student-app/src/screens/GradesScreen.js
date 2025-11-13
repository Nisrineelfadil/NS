import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://192.168.1.31:3000'; // Server IP address

const LANGUAGE_FORMATIONS = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
const BRANCH_FORMATIONS = ['Informatique', 'Gériatrie', 'Aide soignant', 'Agent socio éducatif', 'Assistante sociale', 'Restauration', 'Cuisine', 'Gestion hôtelière'];

export default function GradesScreen({ navigation }) {
  const [grades, setGrades] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  
  // Toggle between languages and branches
  const [viewMode, setViewMode] = useState('languages'); // 'languages' or 'branches'
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [selectedExamNumber, setSelectedExamNumber] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null); // A1-B2 for languages
  const [selectedTestType, setSelectedTestType] = useState(null); // miniTest or finalExam

  useEffect(() => {
    loadStudentProfile();
  }, []);

  useEffect(() => {
    if (studentProfile) {
      loadGrades();
    }
  }, [studentProfile, viewMode, selectedFormation, selectedExamNumber, selectedSemester, selectedLevel, selectedTestType]);

  const loadStudentProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('studentToken');
      const response = await axios.get(`${API_URL}/api/grades/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again', [
          { text: 'OK', onPress: () => navigation.replace('Login') }
        ]);
      }
    }
  };

  const loadGrades = async () => {
    try {
      const token = await AsyncStorage.getItem('studentToken');
      
      const params = {};
      if (viewMode === 'branches' && selectedFormation) {
        params.branch = selectedFormation;
        if (selectedExamNumber) params.examNumber = selectedExamNumber;
        if (selectedSemester) params.semester = selectedSemester;
      } else if (viewMode === 'languages' && selectedFormation) {
        params.formation = selectedFormation;
        if (selectedLevel) params.languageLevel = selectedLevel;
        if (selectedTestType) params.testType = selectedTestType;
        if (selectedTestType === 'miniTest' && selectedExamNumber) params.testNumber = selectedExamNumber;
      }

      console.log('📚 Requesting grades with params:', params);
      
      const response = await axios.get(`${API_URL}/api/grades/student/grades`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
        timeout: 10000,
      });

      console.log('✅ Received grades:', response.data.grades?.length || 0);
      
      // Always update grades, even if empty array
      setGrades(response.data.grades || []);
      setStats(response.data.stats || { totalGrades: 0, averageScore: 0 });
    } catch (error) {
      console.error('❌ Error loading grades:', error.message);
      if (error.code === 'ECONNABORTED') {
        Alert.alert('Timeout', 'Server is taking too long to respond. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGrades();
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return { letter: 'A', color: '#10b981' };
    if (percentage >= 80) return { letter: 'B', color: '#3b82f6' };
    if (percentage >= 70) return { letter: 'C', color: '#f59e0b' };
    if (percentage >= 60) return { letter: 'D', color: '#f97316' };
    return { letter: 'F', color: '#ef4444' };
  };

  const getEvaluationStatus = (percentage) => {
    if (percentage >= 70) return { status: 'Approved', icon: 'checkmark-circle', color: '#10b981' };
    if (percentage >= 50) return { status: 'Mid', icon: 'warning', color: '#f59e0b' };
    return { status: 'Failed', icon: 'close-circle', color: '#ef4444' };
  };

  const isLanguageFormation = (formation) => {
    return LANGUAGE_FORMATIONS.includes(formation);
  };

  const getAvailableFormations = () => {
    if (!studentProfile) return [];
    if (viewMode === 'languages') {
      return studentProfile.formation || [];
    } else {
      return studentProfile.filiere || [];
    }
  };

  const getExamCount = (formation) => {
    // Language exams have 4 types (Lesen, Hören, Schreiben, Sprechen)
    // Branch exams typically have 3-5 exams
    if (LANGUAGE_FORMATIONS.includes(formation)) {
      return 4;
    }
    return 5; // Default for branches
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFCC00" />
        <Text style={styles.loadingText}>Loading grades...</Text>
      </View>
    );
  }

  const availableFormations = getAvailableFormations();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFCC00']} />
      }
    >
      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'languages' && styles.toggleButtonActive]}
          onPress={() => {
            setViewMode('languages');
            setSelectedFormation(null);
            setSelectedExamNumber(null);
            setSelectedLevel(null);
            setSelectedTestType(null);
          }}
        >
          <Ionicons 
            name="language" 
            size={20} 
            color={viewMode === 'languages' ? '#fff' : '#6b7280'} 
          />
          <Text style={[
            styles.toggleButtonText,
            viewMode === 'languages' && styles.toggleButtonTextActive
          ]}>
            Languages
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'branches' && styles.toggleButtonActive]}
          onPress={() => {
            setViewMode('branches');
            setSelectedFormation(null);
            setSelectedExamNumber(null);
            setSelectedLevel(null);
            setSelectedTestType(null);
          }}
        >
          <Ionicons 
            name="school" 
            size={20} 
            color={viewMode === 'branches' ? '#fff' : '#6b7280'} 
          />
          <Text style={[
            styles.toggleButtonText,
            viewMode === 'branches' && styles.toggleButtonTextActive
          ]}>
            Subjects
          </Text>
        </TouchableOpacity>
      </View>

      {/* Formation Selector */}
      {availableFormations.length > 0 && (
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>
            Select {viewMode === 'languages' ? 'Language' : 'Subject'}:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.chip, !selectedFormation && styles.chipActive]}
              onPress={() => setSelectedFormation(null)}
            >
              <Text style={[styles.chipText, !selectedFormation && styles.chipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {availableFormations.map((formation) => (
              <TouchableOpacity
                key={formation}
                style={[styles.chip, selectedFormation === formation && styles.chipActive]}
                onPress={() => setSelectedFormation(formation)}
              >
                <Text style={[
                  styles.chipText,
                  selectedFormation === formation && styles.chipTextActive
                ]}>
                  {formation}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Level Selector for Languages OR Exam Number for Branches */}
      {selectedFormation && viewMode === 'languages' && (
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Language Level:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.chip, !selectedLevel && styles.chipActive]}
              onPress={() => setSelectedLevel(null)}
            >
              <Text style={[styles.chipText, !selectedLevel && styles.chipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {['A1', 'A2', 'B1', 'B2'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.chip, selectedLevel === level && styles.chipActive]}
                onPress={() => setSelectedLevel(level)}
              >
                <Text style={[
                  styles.chipText,
                  selectedLevel === level && styles.chipTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Test Type Selector for Languages */}
      {selectedFormation && viewMode === 'languages' && selectedLevel && (
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Test Type:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.chip, !selectedTestType && styles.chipActive]}
              onPress={() => setSelectedTestType(null)}
            >
              <Text style={[styles.chipText, !selectedTestType && styles.chipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, selectedTestType === 'miniTest' && styles.chipActive]}
              onPress={() => setSelectedTestType('miniTest')}
            >
              <Text style={[
                styles.chipText,
                selectedTestType === 'miniTest' && styles.chipTextActive
              ]}>
                Mini Tests
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, selectedTestType === 'finalExam' && styles.chipActive]}
              onPress={() => setSelectedTestType('finalExam')}
            >
              <Text style={[
                styles.chipText,
                selectedTestType === 'finalExam' && styles.chipTextActive
              ]}>
                Final Exam
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Exam Number Selector for Branches */}
      {selectedFormation && viewMode === 'branches' && (
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Exam Number:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.chip, !selectedExamNumber && styles.chipActive]}
              onPress={() => setSelectedExamNumber(null)}
            >
              <Text style={[styles.chipText, !selectedExamNumber && styles.chipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {[...Array(getExamCount(selectedFormation))].map((_, index) => {
              const examNum = index + 1;
              return (
                <TouchableOpacity
                  key={examNum}
                  style={[styles.chip, selectedExamNumber === examNum && styles.chipActive]}
                  onPress={() => setSelectedExamNumber(examNum)}
                >
                  <Text style={[
                    styles.chipText,
                    selectedExamNumber === examNum && styles.chipTextActive
                  ]}>
                    Exam {examNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Semester Selector for Branches */}
      {viewMode === 'branches' && (
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Semester:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {[null, 'Semester 1', 'Semester 2'].map((semester) => (
              <TouchableOpacity
                key={semester || 'all'}
                style={[styles.chip, selectedSemester === semester && styles.chipActive]}
                onPress={() => setSelectedSemester(semester)}
              >
                <Text style={[
                  styles.chipText,
                  selectedSemester === semester && styles.chipTextActive
                ]}>
                  {semester || 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Statistics Card */}
      {stats && grades.length > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="document-text" size={24} color="#FFCC00" />
            <Text style={styles.statValue}>{stats.totalGrades}</Text>
            <Text style={styles.statLabel}>Total Grades</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={24} color="#10b981" />
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {stats.averageScore ? Number(stats.averageScore).toFixed(1) : '0.0'}%
            </Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>
        </View>
      )}

      {/* Grades List */}
      <View style={styles.gradesContainer}>
        {grades.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No grades available</Text>
            <Text style={styles.emptySubtext}>
              {selectedFormation 
                ? `No grades found for ${selectedFormation}` 
                : `Select a ${viewMode === 'languages' ? 'language' : 'subject'} to view grades`}
            </Text>
          </View>
        ) : (
          grades.map((grade, index) => {
            const percentage = (grade.score / grade.maxScore) * 100;
            const isLanguage = isLanguageFormation(grade.formation);
            const displayInfo = isLanguage ? getEvaluationStatus(percentage) : getGradeLetter(percentage);

            return (
              <View key={index} style={styles.gradeCard}>
                <View style={styles.gradeHeader}>
                  <View style={styles.gradeInfo}>
                    <Text style={styles.examType}>
                      {grade.examType}
                      {isLanguage && grade.languageLevel && ` - ${grade.languageLevel}`}
                      {isLanguage && grade.testType === 'miniTest' && grade.testNumber && ` - Test ${grade.testNumber}`}
                      {isLanguage && grade.testType === 'finalExam' && ' - Final Exam'}
                      {!isLanguage && grade.examNumber && ` - Exam ${grade.examNumber}`}
                    </Text>
                    <Text style={styles.formation}>{grade.formation}</Text>
                  </View>
                  <View style={[styles.gradeBadge, { backgroundColor: displayInfo.color }]}>
                    {isLanguage ? (
                      <Ionicons name={displayInfo.icon} size={28} color="#fff" />
                    ) : (
                      <Text style={styles.gradeLetter}>{displayInfo.letter}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.gradeDetails}>
                  {isLanguage && (
                    <View style={styles.detailRow}>
                      <Ionicons name="ribbon" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>Status: {displayInfo.status}</Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Ionicons name="trophy" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      Score: {grade.score}/{grade.maxScore} ({percentage.toFixed(1)}%)
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {new Date(grade.examDate).toLocaleDateString()}
                    </Text>
                  </View>

                  {!isLanguage && grade.semester && (
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{grade.semester}</Text>
                    </View>
                  )}

                  {(grade.autoComment || grade.comments) && (
                    <View style={styles.commentsContainer}>
                      <Text style={styles.commentsLabel}>Comments:</Text>
                      <Text style={[styles.commentsText, isLanguage && { fontStyle: 'italic' }]}>
                        {grade.autoComment || grade.comments}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${percentage}%`, backgroundColor: displayInfo.color },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  toggleContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFCC00',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  selectorContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#FFCC00',
    borderColor: '#FFCC00',
  },
  chipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFCC00',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  gradesContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  gradeCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  gradeInfo: {
    flex: 1,
  },
  examType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  formation: {
    fontSize: 14,
    color: '#6b7280',
  },
  gradeBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeLetter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  gradeDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  commentsContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  commentsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  commentsText: {
    fontSize: 14,
    color: '#374151',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
