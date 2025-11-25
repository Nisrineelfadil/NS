// Moroccan Names Database (French spelling)
// Realistic Moroccan first and last names for test data generation

const moroccanNames = {
  // Male first names (Moroccan, French spelling)
  maleFirstNames: [
    'Youssef', 'Mohammed', 'Ahmed', 'Mehdi', 'Amine', 'Hamza', 'Omar', 'Adam',
    'Ayoub', 'Zakaria', 'Karim', 'Samir', 'Rachid', 'Hassan', 'Hicham', 'Khalid',
    'Abdelaziz', 'Abdellatif', 'Abderrahim', 'Abdellah', 'Adil', 'Anass', 'Bilal',
    'Driss', 'Elias', 'Farid', 'Fouad', 'Haitham', 'Hakim', 'Hamid', 'Houssam',
    'Ibrahim', 'Ilias', 'Imad', 'Ismail', 'Jalal', 'Jamal', 'Kamal', 'Larbi',
    'Majid', 'Mounir', 'Mustapha', 'Nabil', 'Nasser', 'Othmane', 'Oussama', 'Redouane',
    'Riad', 'Saad', 'Said', 'Salah', 'Sami', 'Soufiane', 'Tarik', 'Walid',
    'Yassine', 'Younes', 'Ziad', 'Anas', 'Ayman', 'Badr', 'Fayçal', 'Hajar',
    'Hatim', 'Houssine', 'Issam', 'Jalil', 'Jawad', 'Maher', 'Malik', 'Marouane',
    'Mehdi', 'Morad', 'Mouad', 'Moulay', 'Noureddine', 'Rayan', 'Sofian', 'Taha'
  ],

  // Female first names (Moroccan, French spelling)
  femaleFirstNames: [
    'Fatima', 'Khadija', 'Aicha', 'Zineb', 'Salma', 'Yasmine', 'Imane', 'Sanaa',
    'Amina', 'Nadia', 'Samira', 'Latifa', 'Malika', 'Rachida', 'Hafsa', 'Maryam',
    'Hanane', 'Karima', 'Laila', 'Naima', 'Soumaya', 'Wafa', 'Zahra', 'Amal',
    'Asma', 'Basma', 'Chaimae', 'Dounia', 'Fadwa', 'Ghizlane', 'Hajar', 'Hiba',
    'Houda', 'Ikram', 'Ilham', 'Iman', 'Intissar', 'Jamila', 'Kawtar', 'Kenza',
    'Leila', 'Loubna', 'Manal', 'Meriem', 'Mouna', 'Nabila', 'Najat', 'Nezha',
    'Noura', 'Ouafae', 'Oumaima', 'Rajae', 'Rim', 'Sabah', 'Safae', 'Saida',
    'Siham', 'Soukaina', 'Souad', 'Widad', 'Yousra', 'Zainab', 'Amira', 'Btissam',
    'Chaima', 'Dalal', 'Fatiha', 'Hayat', 'Ibtissam', 'Jihane', 'Lamia', 'Maha',
    'Malak', 'Nour', 'Rania', 'Salima', 'Sara', 'Soraya', 'Wissal', 'Zakia'
  ],

  // Common Moroccan last names (French spelling)
  lastNames: [
    'Alami', 'Benali', 'Tazi', 'Fassi', 'Idrissi', 'Benjelloun', 'Berrada', 'Chraibi',
    'El Amrani', 'El Fassi', 'El Idrissi', 'El Khalifi', 'El Mansouri', 'El Mernissi',
    'Filali', 'Hassani', 'Kadiri', 'Kettani', 'Lahlou', 'Lamrani', 'Lazrak', 'Mazouz',
    'Mekouar', 'Naciri', 'Ouazzani', 'Sefrioui', 'Skalli', 'Tahiri', 'Zahraoui', 'Zniber',
    'Abbadi', 'Abdelkader', 'Abou', 'Achour', 'Adnane', 'Afailal', 'Agoumi', 'Aissaoui',
    'Alaoui', 'Amrani', 'Andaloussi', 'Azami', 'Aziz', 'Bakkali', 'Balafrej', 'Bargach',
    'Belhaj', 'Belkadi', 'Belmekki', 'Benabdallah', 'Benabdeljalil', 'Benaissa', 'Benchekroun',
    'Benkirane', 'Bennis', 'Benslimane', 'Bensaid', 'Bentahar', 'Benyahia', 'Benyakhlef',
    'Bouabid', 'Bouazza', 'Boucetta', 'Boudlal', 'Bouhia', 'Boukhari', 'Boussaid', 'Chafik',
    'Chaoui', 'Cherkaoui', 'Dahbi', 'Drissi', 'Eddahbi', 'Elalamy', 'Elouardi', 'Essaadi',
    'Essalhi', 'Fathi', 'Ghali', 'Guessous', 'Haddad', 'Hajji', 'Hammouchi', 'Harti',
    'Hilali', 'Houmani', 'Jaafari', 'Jebli', 'Kamal', 'Karam', 'Khamlichi', 'Khatib',
    'Lahrizi', 'Laroui', 'Lyazidi', 'Mahjoub', 'Majidi', 'Mansouri', 'Marrakchi', 'Masmoudi',
    'Mekki', 'Mernissi', 'Moussaoui', 'Naji', 'Nejjar', 'Omari', 'Ouahabi', 'Oulahcen',
    'Rahhali', 'Raissouni', 'Rami', 'Regragui', 'Rhazi', 'Sabir', 'Saidi', 'Salhi',
    'Sbihi', 'Sekkat', 'Slaoui', 'Taarji', 'Tazi', 'Tijani', 'Touhami', 'Yaacoubi',
    'Zahiri', 'Zaki', 'Zemmouri', 'Zerhouni', 'Ziani', 'Zouiten'
  ],

  // Fez neighborhoods and streets for addresses
  fezAddresses: {
    neighborhoods: [
      'Médina', 'Ville Nouvelle', 'Agdal', 'Atlas', 'Bensouda', 'Narjiss',
      'Saiss', 'Zouagha', 'Hay Anas', 'Hay Qods', 'Route Imouzzer', 'Route Sefrou',
      'Ain Kadous', 'Ain Nokbi', 'Dhar Mehraz', 'Jnane El Ward', 'Oued Fes'
    ],
    streets: [
      'Avenue Hassan II', 'Avenue Mohammed V', 'Boulevard Allal El Fassi', 'Boulevard Moulay Youssef',
      'Rue de la Liberté', 'Rue Abdelkrim El Khattabi', 'Rue Ahmed Chaouki', 'Rue Bab Guissa',
      'Rue Batha', 'Rue des Mérinides', 'Rue Talaa Kebira', 'Rue Talaa Sghira',
      'Avenue Abdelkrim Khattabi', 'Avenue des FAR', 'Avenue Lalla Meryem', 'Avenue My Abdellah',
      'Rue Abou Hanifa', 'Rue Ain Azliten', 'Rue Akari', 'Rue Ben Jelloun',
      'Rue Bouanania', 'Rue Chorfaa', 'Rue Derb Touil', 'Rue El Attarine',
      'Rue El Mokri', 'Rue Fes El Bali', 'Rue Kairaouine', 'Rue Nejjarine',
      'Rue Rcif', 'Rue Seffarine', 'Rue Sidi Ahmed Tijani', 'Rue Souika'
    ]
  },

  // Moroccan phone number prefixes
  phoneNumberPrefixes: [
    '0610', '0611', '0612', '0613', '0614', '0615', '0616', '0617', '0618', '0619',
    '0620', '0621', '0622', '0623', '0624', '0625', '0626', '0627', '0628', '0629',
    '0630', '0631', '0632', '0633', '0634', '0635', '0636', '0637', '0638', '0639',
    '0640', '0641', '0642', '0643', '0644', '0645', '0646', '0647', '0648', '0649',
    '0650', '0651', '0652', '0653', '0654', '0655', '0656', '0657', '0658', '0659',
    '0660', '0661', '0662', '0663', '0664', '0665', '0666', '0667', '0668', '0669',
    '0670', '0671', '0672', '0673', '0674', '0675', '0676', '0677', '0678', '0679',
    '0680', '0681', '0682', '0683', '0684', '0685', '0686', '0687', '0688', '0689',
    '0690', '0691', '0692', '0693', '0694', '0695', '0696', '0697', '0698', '0699'
  ]
};

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateMoroccanName(gender = null) {
  // If gender not specified, randomly choose
  if (!gender) {
    gender = Math.random() > 0.5 ? 'male' : 'female';
  }

  const firstName = gender === 'male' 
    ? getRandomElement(moroccanNames.maleFirstNames)
    : getRandomElement(moroccanNames.femaleFirstNames);
  
  const lastName = getRandomElement(moroccanNames.lastNames);

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    gender
  };
}

function generateMoroccanPhone() {
  const prefix = getRandomElement(moroccanNames.phoneNumberPrefixes);
  const suffix = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `${prefix}${suffix}`;
}

function generateFezAddress() {
  const neighborhood = getRandomElement(moroccanNames.fezAddresses.neighborhoods);
  const street = getRandomElement(moroccanNames.fezAddresses.streets);
  const number = Math.floor(1 + Math.random() * 200);
  
  return {
    street: `${number}, ${street}`,
    neighborhood,
    city: 'Fès',
    fullAddress: `${number}, ${street}, ${neighborhood}, Fès, Maroc`
  };
}

module.exports = {
  moroccanNames,
  generateMoroccanName,
  generateMoroccanPhone,
  generateFezAddress,
  getRandomElement
};
