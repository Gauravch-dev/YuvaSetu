
export const APPLICATIONS = [
  {
    id: 1,
    role: 'Senior Frontend Engineer',
    company: 'TechCorp',
    logo: 'https://cdn.iconscout.com/icon/free/png-256/free-google-1772223-1507807.png',
    status: 'Interviewing',
    appliedDate: '12 Jan 2024',
    location: 'Bangalore',
    timeline: [
      { step: 'Applied', date: '12 Jan 2024', status: 'completed', description: 'Application submitted successfully' },
      { step: 'Screening', date: '15 Jan 2024', status: 'completed', description: 'HR Screening call completed' },
      { step: 'Technical Round 1', date: '18 Jan 2024', status: 'completed', description: 'Data Structures & Algorithms' },
      { step: 'Technical Round 2', date: '22 Jan 2024', status: 'current', description: 'System Design Interview scheduled' },
      { step: 'Managerial Round', date: 'TBD', status: 'upcoming', description: 'Behavioral interview' },
      { step: 'Offer', date: 'TBD', status: 'upcoming', description: 'Final offer discussion' }
    ]
  },
  {
    id: 2,
    role: 'Product Designer',
    company: 'DesignStudio',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/2048px-Instagram_icon.png',
    status: 'Shortlisted',
    appliedDate: '10 Jan 2024',
    location: 'Remote',
    timeline: [
       { step: 'Applied', date: '10 Jan 2024', status: 'completed', description: 'Portfolio submitted' },
       { step: 'Portfolio Review', date: '12 Jan 2024', status: 'completed', description: 'Review by Design Lead' },
       { step: 'Design Task', date: '14 Jan 2024', status: 'current', description: 'Take-home assignment sent' },
       { step: 'Final Interview', date: 'TBD', status: 'upcoming', description: 'Team fitment round' }
    ]
  },
  {
    id: 3,
    role: 'Full Stack Developer',
    company: 'StartupX',
    logo: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
    status: 'Rejected',
    appliedDate: '05 Jan 2024',
    location: 'Mumbai',
    timeline: [
      { step: 'Applied', date: '05 Jan 2024', status: 'completed' },
      { step: 'Screening', date: '08 Jan 2024', status: 'completed' },
      { step: 'Technical Round', date: '10 Jan 2024', status: 'completed', description: 'Feedback: Strong backend skills but frontend proficiency needs improvement.' },
      { step: 'Rejection', date: '12 Jan 2024', status: 'rejected', description: 'Application not moving forward' }
    ]
  },
  {
    id: 4,
    role: 'React Native Dev',
    company: 'MobileFirst',
    logo: 'https://cdn-icons-png.flaticon.com/512/174/174857.png',
    status: 'Applied',
    appliedDate: '03 Jan 2024',
    location: 'Pune',
    timeline: [
       { step: 'Applied', date: '03 Jan 2024', status: 'current', description: 'Application under review' },
       { step: 'Screening', date: 'TBD', status: 'upcoming' }
    ]
  }
];
