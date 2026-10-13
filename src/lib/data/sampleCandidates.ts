export interface SampleCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  yearsExperience: number;
  degree: string;
  degreeField: string;
  isCsDegree: boolean;
  skills: string[];
  summary: string;
  workHistory: {
    role: string;
    company: string;
    period: string;
    description: string;
  }[];
  expectedOutcome: 'RECOMMENDED' | 'NEEDS_REVIEW' | 'NOT_RECOMMENDED';
  expectedReason: string;
}

export const sample30Candidates: SampleCandidate[] = [
  {
    id: 'cand-01',
    name: 'Elena Rostova',
    email: 'elena.rostova@techmail.io',
    phone: '+44 7700 900101',
    location: 'London, UK',
    title: 'Senior Full-Stack Engineer',
    yearsExperience: 6.5,
    degree: 'MSc Advanced Computing',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Vitest', 'Docker', 'Prisma'],
    summary: 'Senior software engineer with 6.5 years building robust web apps. Deep expertise in React hooks, TypeScript type safety, and relational PostgreSQL database architectures.',
    workHistory: [
      {
        role: 'Lead Full-Stack Engineer',
        company: 'FinTech Nexus UK',
        period: '2021 - Present',
        description: 'Architected Next.js and Node.js microservices handling 2M+ monthly transactions. Enforced 90% Vitest unit test coverage and PostgreSQL query optimizations.',
      },
      {
        role: 'Full-Stack Developer',
        company: 'CloudPulse Software',
        period: '2018 - 2021',
        description: 'Developed TypeScript customer-facing portals and RESTful APIs backed by PostgreSQL and Prisma ORM.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Meets CS degree and >3 years experience. High proficiency in TypeScript, React, Node, and automated testing.',
  },
  {
    id: 'cand-02',
    name: 'Marcus Vance',
    email: 'marcus.vance@devstack.org',
    phone: '+1 415 555 0192',
    location: 'San Francisco, CA',
    title: 'Senior Software Engineer',
    yearsExperience: 5.0,
    degree: 'BSc Computer Science',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Jest', 'Redis', 'GraphQL'],
    summary: 'Full-stack developer with 5 years commercial production experience in cloud SaaS platforms using TypeScript and PostgreSQL.',
    workHistory: [
      {
        role: 'Senior Software Engineer',
        company: 'SaaSify Labs',
        period: '2022 - Present',
        description: 'Engineered high-throughput TypeScript backend services and modern React frontends. Implemented end-to-end integration tests with Jest.',
      },
      {
        role: 'Software Engineer',
        company: 'BayArea Cloud',
        period: '2019 - 2022',
        description: 'Built scalable REST APIs in Node.js and maintained relational schemas in PostgreSQL.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Meets CS degree, 5 years experience, comprehensive full-stack testing experience.',
  },
  {
    id: 'cand-03',
    name: 'Priya Sharma',
    email: 'priya.sharma@indiadev.in',
    phone: '+91 98200 12345',
    location: 'Bangalore, India (Remote)',
    title: 'Senior Web Developer',
    yearsExperience: 4.5,
    degree: 'B.Tech Computer Science & Engineering',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['TypeScript', 'Next.js', 'React', 'Node.js', 'PostgreSQL', 'Vitest', 'TailwindCSS'],
    summary: 'Passionate full-stack engineer with 4.5 years of experience delivering performant React and Next.js applications.',
    workHistory: [
      {
        role: 'Senior Web Developer',
        company: 'Infosys Digital',
        period: '2021 - Present',
        description: 'Led a team of 4 engineers building enterprise dashboard apps using TypeScript, Next.js, and PostgreSQL.',
      },
      {
        role: 'Software Engineer',
        company: 'TechMahindra Innovations',
        period: '2019 - 2021',
        description: 'Created backend services in Node.js and maintained automated test suites.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Meets all mandatory criteria with solid test coverage experience.',
  },
  {
    id: 'cand-04',
    name: 'David Kim',
    email: 'david.kim@austintech.io',
    phone: '+1 512 555 8899',
    location: 'Austin, TX',
    title: 'Staff Full-Stack Developer',
    yearsExperience: 7.0,
    degree: 'BSc Computer Science',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Prisma', 'Vitest', 'AWS', 'CI/CD'],
    summary: 'Experienced engineer with 7 years architecting enterprise applications in TypeScript, React, and Node.js.',
    workHistory: [
      {
        role: 'Lead Developer',
        company: 'Apex Cloud Solutions',
        period: '2020 - Present',
        description: 'Directed migration from legacy monolith to TypeScript/Node.js microservices with PostgreSQL.',
      },
      {
        role: 'Full-Stack Developer',
        company: 'Austin Interactive',
        period: '2017 - 2020',
        description: 'Delivered customer portals using React, Node.js, and relational databases.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Over 7 years experience with complete stack mastery.',
  },
  {
    id: 'cand-05',
    name: 'Arthur Pendelton',
    email: 'arthur.pendelton@oxon.co.uk',
    phone: '+44 7700 900222',
    location: 'Oxford, UK',
    title: 'Full-Stack Engineer',
    yearsExperience: 3.5,
    degree: 'BSc Computer Science',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Jest', 'Docker'],
    summary: 'Software engineer with 3.5 years developing modern TypeScript and Node.js cloud solutions.',
    workHistory: [
      {
        role: 'Software Engineer',
        company: 'Oxon Analytics',
        period: '2021 - Present',
        description: 'Built data dashboard frontends with React and backend ingestion workers with Node.js and PostgreSQL.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Meets mandatory 3-year threshold and CS degree requirements.',
  },
  {
    id: 'cand-06',
    name: 'Fatima Al-Zahra',
    email: 'fatima.alzahra@gulftech.ae',
    phone: '+971 50 123 4567',
    location: 'Dubai, UAE',
    title: 'Senior Software Engineer',
    yearsExperience: 5.5,
    degree: 'BSc Software Engineering',
    degreeField: 'Software Engineering',
    isCsDegree: true,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Jest', 'GraphQL', 'Docker'],
    summary: '5.5 years in cloud-native application engineering with a strong focus on clean code and reliable PostgreSQL schemas.',
    workHistory: [
      {
        role: 'Senior Software Engineer',
        company: 'Emirates Digital Hub',
        period: '2021 - Present',
        description: 'Built enterprise web apps in React and TypeScript with comprehensive Jest test coverage.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Accredited Software Engineering degree with 5.5 years verified experience.',
  },
  {
    id: 'cand-07',
    name: 'Carlos Mendez',
    email: 'carlos.mendez@madridcode.es',
    phone: '+34 91 123 4567',
    location: 'Madrid, Spain',
    title: 'Full-Stack Developer',
    yearsExperience: 4.0,
    degree: 'BSc Computer Science',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Vitest', 'Prisma'],
    summary: '4 years experience delivering responsive web applications with TypeScript, React, and PostgreSQL.',
    workHistory: [
      {
        role: 'Full-Stack Developer',
        company: 'Iberia Tech Services',
        period: '2020 - Present',
        description: 'Maintained core SaaS portal in React/Node.js with PostgreSQL backend.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Meets all mandatory criteria and strong weighted skill profile.',
  },
  {
    id: 'cand-08',
    name: 'Chloe Dubois',
    email: 'chloe.dubois@paristech.fr',
    phone: '+33 1 42 68 00 00',
    location: 'Paris, France',
    title: 'Senior Cloud Engineer',
    yearsExperience: 6.0,
    degree: 'MSc Computer Science',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['TypeScript', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'Vitest', 'Kubernetes'],
    summary: 'MSc graduate with 6 years experience specializing in Next.js, Node.js backend systems, and PostgreSQL architectures.',
    workHistory: [
      {
        role: 'Senior Cloud Developer',
        company: 'Veloce Systems Paris',
        period: '2020 - Present',
        description: 'Led architecture of cloud microservices with TypeScript and PostgreSQL.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Master degree in CS, 6 years experience, and modern stack.',
  },
  {
    id: 'cand-09',
    name: 'Liam O\'Connor',
    email: 'liam.oconnor@dublindev.ie',
    phone: '+353 1 496 0000',
    location: 'Dublin, Ireland',
    title: 'Full-Stack Engineer',
    yearsExperience: 4.2,
    degree: 'BSc Computer Science',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Jest', 'CI/CD'],
    summary: '4.2 years of production experience in Dublin tech ecosystem building scalable TypeScript applications.',
    workHistory: [
      {
        role: 'Full-Stack Engineer',
        company: 'Silicon Docks Tech',
        period: '2020 - Present',
        description: 'Built high performance web frontends and Node.js backend APIs.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Meets all criteria requirements.',
  },
  {
    id: 'cand-10',
    name: 'Kenji Takahashi',
    email: 'kenji.takahashi@tokyosoft.jp',
    phone: '+81 3 5555 0143',
    location: 'Tokyo, Japan',
    title: 'Web Systems Engineer',
    yearsExperience: 5.0,
    degree: 'BSc Information Technology',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Vitest'],
    summary: '5 years building resilient web services with React, Node.js, and relational database modeling.',
    workHistory: [
      {
        role: 'Systems Engineer',
        company: 'Tokyo Cloud Works',
        period: '2019 - Present',
        description: 'Engineered web applications and automated CI/CD pipeline with Vitest.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Meets all mandatory criteria.',
  },
  {
    id: 'cand-11',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@bristolcode.co.uk',
    phone: '+44 7700 900333',
    location: 'Bristol, UK',
    title: 'Full-Stack Developer',
    yearsExperience: 3.8,
    degree: 'BSc Software Engineering',
    degreeField: 'Software Engineering',
    isCsDegree: true,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Vitest'],
    summary: 'Full-stack software engineer with 3.8 years building data-intensive applications.',
    workHistory: [
      {
        role: 'Software Developer',
        company: 'Bristol Engine Works',
        period: '2020 - Present',
        description: 'Developed modern web applications using TypeScript and PostgreSQL.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Meets degree and experience requirements.',
  },
  {
    id: 'cand-12',
    name: 'Mateo Rossi',
    email: 'mateo.rossi@milanotech.it',
    phone: '+39 02 5555 1234',
    location: 'Milan, Italy',
    title: 'Backend & Full-Stack Developer',
    yearsExperience: 5.2,
    degree: 'BSc Computer Engineering',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['Node.js', 'TypeScript', 'React', 'PostgreSQL', 'Docker', 'Jest'],
    summary: '5.2 years developing scalable backend architectures and React user interfaces.',
    workHistory: [
      {
        role: 'Full-Stack Engineer',
        company: 'Lombardy Digital Labs',
        period: '2019 - Present',
        description: 'Managed PostgreSQL database schemas and built Node.js microservices.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Meets all mandatory criteria.',
  },
  {
    id: 'cand-13',
    name: 'Amina Diallo',
    email: 'amina.diallo@africatech.sn',
    phone: '+221 33 800 0000',
    location: 'Dakar, Senegal',
    title: 'Senior Full-Stack Engineer',
    yearsExperience: 4.8,
    degree: 'MSc Computer Science',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Vitest'],
    summary: '4.8 years experience in fintech and cloud platforms using TypeScript and Next.js.',
    workHistory: [
      {
        role: 'Lead Web Engineer',
        company: 'Dakar FinServices',
        period: '2020 - Present',
        description: 'Delivered web banking portal with TypeScript and PostgreSQL.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'MSc in Computer Science with over 4 years experience.',
  },
  {
    id: 'cand-14',
    name: 'Benjamin Miller',
    email: 'benjamin.miller@chicagotech.io',
    phone: '+1 312 555 4321',
    location: 'Chicago, IL',
    title: 'Senior Full-Stack Engineer',
    yearsExperience: 6.0,
    degree: 'BSc Computer Science',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Vitest', 'Docker'],
    summary: '6 years of full-stack engineering with extensive testing and relational SQL architecture.',
    workHistory: [
      {
        role: 'Senior Engineer',
        company: 'Midwest Software Group',
        period: '2018 - Present',
        description: 'Led technical design of web portals with Vitest automated testing.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Meets all requirements with high score.',
  },
  {
    id: 'cand-15',
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@vanbc.ca',
    phone: '+1 604 555 7890',
    location: 'Vancouver, Canada',
    title: 'Software Engineer',
    yearsExperience: 4.0,
    degree: 'BSc Computer Science',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Vitest'],
    summary: '4 years building clean and reliable web applications in TypeScript and Node.js.',
    workHistory: [
      {
        role: 'Full-Stack Developer',
        company: 'Pacific Rim Cloud',
        period: '2020 - Present',
        description: 'Engineered web applications and automated test suites.',
      },
    ],
    expectedOutcome: 'RECOMMENDED',
    expectedReason: 'Meets CS degree and 4 years experience criteria.',
  },

  // --- Borderline & Human Review Cases (8 Candidates) ---
  {
    id: 'cand-16',
    name: 'Oliver Bennett',
    email: 'oliver.bennett@uktech.co.uk',
    phone: '+44 7700 900444',
    location: 'Manchester, UK',
    title: 'Mid-Level Full-Stack Developer',
    yearsExperience: 2.8,
    degree: 'BSc Computer Science',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Jest'],
    summary: '2.8 years experience. Excellent technical skills in TypeScript, React, and PostgreSQL.',
    workHistory: [
      {
        role: 'Software Developer',
        company: 'Manchester Codehouse',
        period: '2021 - Present',
        description: 'Developed modern web applications. Total commercial tenure: 2.8 years.',
      },
    ],
    expectedOutcome: 'NEEDS_REVIEW',
    expectedReason: 'Borderline experience duration (2.8 years vs 3.0 years requirement). Requires HR discretion.',
  },
  {
    id: 'cand-17',
    name: 'Sophie Martin',
    email: 'sophie.martin@lyoncode.fr',
    phone: '+33 4 72 00 00 00',
    location: 'Lyon, France',
    title: 'Senior Web Developer',
    yearsExperience: 5.0,
    degree: 'Coding Bootcamp Diploma in Full-Stack Web Development',
    degreeField: 'Vocational Web Bootcamp',
    isCsDegree: false,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Prisma', 'Vitest'],
    summary: '5 years commercial experience building web apps. Graduate of intensive full-stack bootcamp.',
    workHistory: [
      {
        role: 'Senior Web Developer',
        company: 'Rhone Digital',
        period: '2019 - Present',
        description: 'Engineered React and Node.js solutions with PostgreSQL for 5 years.',
      },
    ],
    expectedOutcome: 'NEEDS_REVIEW',
    expectedReason: 'Extensive 5 years experience, but degree is vocational bootcamp rather than accredited university degree.',
  },
  {
    id: 'cand-18',
    name: 'Tariq Mansoor',
    email: 'tariq.mansoor@techpak.pk',
    phone: '+92 21 3555 1234',
    location: 'Karachi, Pakistan',
    title: 'Full-Stack Engineer',
    yearsExperience: 3.5,
    degree: 'BSc Electrical Engineering',
    degreeField: 'Electrical Engineering',
    isCsDegree: false,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Vitest'],
    summary: '3.5 years experience in web application development with strong mathematical and algorithmic background.',
    workHistory: [
      {
        role: 'Software Engineer',
        company: 'Karachi Software House',
        period: '2020 - Present',
        description: 'Developed full-stack web applications using TypeScript and relational databases.',
      },
    ],
    expectedOutcome: 'NEEDS_REVIEW',
    expectedReason: 'Technical engineering degree (Electrical) rather than Computer Science. Requires HR degree equivalence review.',
  },
  {
    id: 'cand-19',
    name: 'Emma Watson-Smith',
    email: 'emma.watsonsmith@cambridge.ac.uk',
    phone: '+44 7700 900555',
    location: 'Cambridge, UK',
    title: 'Associate Software Engineer',
    yearsExperience: 2.5,
    degree: 'BSc Computer Science (First Class Hons)',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['TypeScript', 'React', 'Next.js', 'PostgreSQL', 'Vitest'],
    summary: 'First-class Cambridge CS graduate with 2.5 years industry experience and exceptional technical projects.',
    workHistory: [
      {
        role: 'Software Engineer',
        company: 'Silicon Fen Systems',
        period: '2022 - Present',
        description: 'Developed modern React applications with TypeScript and Vitest.',
      },
    ],
    expectedOutcome: 'NEEDS_REVIEW',
    expectedReason: 'Top-tier CS degree, but 2.5 years experience falls slightly below the 3.0 years requirement.',
  },
  {
    id: 'cand-20',
    name: 'Vikram Patel',
    email: 'vikram.patel@mumbaitech.in',
    phone: '+91 22 2555 6789',
    location: 'Mumbai, India',
    title: 'Senior Full-Stack Engineer',
    yearsExperience: 6.0,
    degree: 'Self-Taught / High School Diploma',
    degreeField: 'None',
    isCsDegree: false,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Vitest', 'Redis'],
    summary: '6 years of production web engineering. Self-taught open source contributor with proven architectural mastery.',
    workHistory: [
      {
        role: 'Senior Software Engineer',
        company: 'Mumbai Cloud Studio',
        period: '2018 - Present',
        description: 'Built scalable web applications for 6 years using TypeScript and PostgreSQL.',
      },
    ],
    expectedOutcome: 'NEEDS_REVIEW',
    expectedReason: 'Outstanding 6 years commercial experience, but lacks accredited university degree.',
  },
  {
    id: 'cand-21',
    name: 'Lucas Silva',
    email: 'lucas.silva@saopaulo.br',
    phone: '+55 11 9999 1234',
    location: 'São Paulo, Brazil',
    title: 'Software Developer',
    yearsExperience: 3.2,
    degree: 'Bachelor of Mathematics & Statistics',
    degreeField: 'Mathematics',
    isCsDegree: false,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Jest'],
    summary: '3.2 years software development with strong analytical foundation in mathematics.',
    workHistory: [
      {
        role: 'Full-Stack Developer',
        company: 'Paulista Digital',
        period: '2021 - Present',
        description: 'Built financial web apps in TypeScript and PostgreSQL.',
      },
    ],
    expectedOutcome: 'NEEDS_REVIEW',
    expectedReason: 'Meets 3.2 years experience, but degree is in Mathematics rather than Computer Science.',
  },
  {
    id: 'cand-22',
    name: 'Nadia Chernova',
    email: 'nadia.chernova@eutec.eu',
    phone: '+48 22 555 4321',
    location: 'Warsaw, Poland',
    title: 'Full-Stack Developer',
    yearsExperience: 2.9,
    degree: 'BSc Software Engineering',
    degreeField: 'Software Engineering',
    isCsDegree: true,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Vitest'],
    summary: '2.9 years building modern web applications with strict unit test coverage.',
    workHistory: [
      {
        role: 'Software Developer',
        company: 'Vistula Cloud Labs',
        period: '2021 - Present',
        description: 'Developed web services in TypeScript and Vitest.',
      },
    ],
    expectedOutcome: 'NEEDS_REVIEW',
    expectedReason: '2.9 years experience is near the 3.0 threshold. Flagged for review.',
  },
  {
    id: 'cand-23',
    name: 'Grace Hopper-Cole',
    email: 'grace.hoppercole@nytech.com',
    phone: '+1 212 555 9876',
    location: 'New York, NY',
    title: 'Full-Stack Engineer',
    yearsExperience: 4.0,
    degree: 'BSc Applied Physics',
    degreeField: 'Physics',
    isCsDegree: false,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Vitest'],
    summary: '4 years web development after transitioning from academic physics.',
    workHistory: [
      {
        role: 'Software Engineer',
        company: 'Manhattan Tech Works',
        period: '2020 - Present',
        description: 'Engineered web services with TypeScript and PostgreSQL.',
      },
    ],
    expectedOutcome: 'NEEDS_REVIEW',
    expectedReason: '4 years experience with Physics degree. Degree relevance requires human determination.',
  },

  // --- Ineligible & Deficient Candidates (7 Candidates) ---
  {
    id: 'cand-24',
    name: 'Kevin Spacey-Lee',
    email: 'kevin.spaceylee@gradmail.com',
    phone: '+1 415 555 9900',
    location: 'San Jose, CA',
    title: 'Junior Frontend Developer',
    yearsExperience: 0.8,
    degree: 'BSc Computer Science',
    degreeField: 'Computer Science',
    isCsDegree: true,
    skills: ['HTML', 'CSS', 'Basic React', 'JavaScript'],
    summary: 'Recent CS graduate with 8 months internship experience in frontend development.',
    workHistory: [
      {
        role: 'Frontend Intern',
        company: 'Silicon Valley Startups',
        period: '2023 - Present',
        description: 'Assisted in styling React components.',
      },
    ],
    expectedOutcome: 'NOT_RECOMMENDED',
    expectedReason: 'Fails mandatory requirement: Only 0.8 years experience (requires 3+ years).',
  },
  {
    id: 'cand-25',
    name: 'Amanda Rivera',
    email: 'amanda.rivera@designhub.com',
    phone: '+1 305 555 3344',
    location: 'Miami, FL',
    title: 'Graphic & UI Designer',
    yearsExperience: 4.0,
    degree: 'Bachelor of Fine Arts (Graphic Design)',
    degreeField: 'Fine Arts',
    isCsDegree: false,
    skills: ['Figma', 'Adobe Photoshop', 'Illustrator', 'HTML', 'CSS'],
    summary: '4 years experience as visual designer and Figma specialist with no backend or TypeScript coding experience.',
    workHistory: [
      {
        role: 'Senior UI Designer',
        company: 'Miami Creative Agency',
        period: '2020 - Present',
        description: 'Created UI wireframes and brand guidelines in Figma.',
      },
    ],
    expectedOutcome: 'NOT_RECOMMENDED',
    expectedReason: 'Fails mandatory CS degree requirement and lacks full-stack TypeScript/Node.js/PostgreSQL competencies.',
  },
  {
    id: 'cand-26',
    name: 'Joshua Taylor',
    email: 'joshua.taylor@saassales.com',
    phone: '+44 7700 900666',
    location: 'Leeds, UK',
    title: 'SaaS Sales Executive',
    yearsExperience: 5.0,
    degree: 'BA Business Administration & Marketing',
    degreeField: 'Business',
    isCsDegree: false,
    skills: ['Salesforce', 'Hubspot', 'Enterprise Negotiation', 'Pipeline Management'],
    summary: '5 years closing enterprise software deals. Looking to transition into technology management.',
    workHistory: [
      {
        role: 'Senior Account Executive',
        company: 'CloudSales UK',
        period: '2019 - Present',
        description: 'Closed enterprise software subscriptions.',
      },
    ],
    expectedOutcome: 'NOT_RECOMMENDED',
    expectedReason: 'Fails all mandatory and weighted software engineering criteria.',
  },
  {
    id: 'cand-27',
    name: 'Hannah Schmidt',
    email: 'hannah.schmidt@berlindev.de',
    phone: '+49 30 5555 9876',
    location: 'Berlin, Germany',
    title: 'Junior Web Apprentice',
    yearsExperience: 1.2,
    degree: 'Abitur / High School Diploma',
    degreeField: 'None',
    isCsDegree: false,
    skills: ['HTML5', 'CSS3', 'Basic JavaScript', 'WordPress'],
    summary: '1.2 years assisting with WordPress sites and static marketing pages.',
    workHistory: [
      {
        role: 'Junior Web Assistant',
        company: 'Berlin Media Agency',
        period: '2023 - Present',
        description: 'Edited WordPress templates and updated web content.',
      },
    ],
    expectedOutcome: 'NOT_RECOMMENDED',
    expectedReason: 'Fails mandatory CS degree requirement and has under 3 years experience.',
  },
  {
    id: 'cand-28',
    name: 'Dmitri Voronov',
    email: 'dmitri.voronov@microchip.org',
    phone: '+372 600 0000',
    location: 'Tallinn, Estonia',
    title: 'Embedded Firmware Engineer',
    yearsExperience: 6.0,
    degree: 'BSc Electrical Engineering',
    degreeField: 'Electrical Engineering',
    isCsDegree: false,
    skills: ['C', 'Assembly', 'RTOS', 'ARM Cortex', 'Hardware Debugging'],
    summary: '6 years writing low-level microcontroller firmware. Zero web or cloud development experience.',
    workHistory: [
      {
        role: 'Firmware Engineer',
        company: 'Baltic Robotics',
        period: '2018 - Present',
        description: 'Programmed embedded C algorithms on bare-metal hardware.',
      },
    ],
    expectedOutcome: 'NOT_RECOMMENDED',
    expectedReason: 'Lacks modern web stack (TypeScript, React, Node.js, PostgreSQL).',
  },
  {
    id: 'cand-29',
    name: 'Zoe Chen',
    email: 'zoe.chen@contentseo.com',
    phone: '+1 416 555 4567',
    location: 'Toronto, Canada',
    title: 'SEO & Content Specialist',
    yearsExperience: 3.0,
    degree: 'BA English Literature',
    degreeField: 'Humanities',
    isCsDegree: false,
    skills: ['Google Analytics', 'Ahrefs', 'Technical SEO', 'Copywriting'],
    summary: '3 years optimizing blog posts and landing pages for organic search visibility.',
    workHistory: [
      {
        role: 'SEO Manager',
        company: 'Toronto Growth Media',
        period: '2021 - Present',
        description: 'Managed content strategy and keyword research.',
      },
    ],
    expectedOutcome: 'NOT_RECOMMENDED',
    expectedReason: 'Non-technical background; fails all software engineering criteria.',
  },
  {
    id: 'cand-30',
    name: 'Tyler Robinson',
    email: 'tyler.robinson@bootcamper.io',
    phone: '+1 206 555 1122',
    location: 'Seattle, WA',
    title: 'Junior Developer',
    yearsExperience: 0.3,
    degree: 'BA History',
    degreeField: 'Humanities',
    isCsDegree: false,
    skills: ['JavaScript', 'HTML', 'CSS', 'Git'],
    summary: 'Recent 12-week coding bootcamp graduate with history degree looking for first technical role.',
    workHistory: [
      {
        role: 'Junior Web Intern',
        company: 'Seattle Digital Startup',
        period: '2024 - Present',
        description: 'Completed 12-week coding course and 3-month unpaid internship.',
      },
    ],
    expectedOutcome: 'NOT_RECOMMENDED',
    expectedReason: 'Fails mandatory CS degree requirement and only 0.3 years experience (requires 3+ years).',
  },
];

export function generateCombinedDossierText(): string {
  const header = `================================================================================
TALENTSCREEN AI | MULTI-CANDIDATE RECRUITMENT DOSSIER
BATCH: 30 REALISTIC CANDIDATE CVS
ROLE: SENIOR FULL-STACK ENGINEER (job-001)
TOTAL CANDIDATES IN DOSSIER: 30
================================================================================

This document contains 30 candidate CV documents formatted sequentially.
Each candidate record is preceded by a '=== CANDIDATE #XX ===' boundary.
`;

  const candidatesText = sample30Candidates
    .map((c, index) => {
      const num = String(index + 1).padStart(2, '0');
      const skillsStr = c.skills.join(', ');
      const historyStr = c.workHistory
        .map(
          (w) => `  * ${w.role} at ${w.company} (${w.period})
    ${w.description}`
        )
        .join('\n');

      return `================================================================================
=== CANDIDATE #${num}: ${c.name.toUpperCase()} ===
================================================================================
Full Name: ${c.name}
Target Role: Senior Full-Stack Engineer
Email: ${c.email}
Phone: ${c.phone}
Location: ${c.location}
Years of Commercial Experience: ${c.yearsExperience} years
Highest Degree: ${c.degree} (${c.degreeField})
Accredited CS/SE Degree: ${c.isCsDegree ? 'Yes' : 'No'}

PROFESSIONAL SUMMARY:
${c.summary}

TECHNICAL SKILLS & COMPETENCIES:
${skillsStr}

COMMERCIAL WORK EXPERIENCE:
${historyStr}

EDUCATION & CREDENTIALS:
  * ${c.degree} - Accredited Institution (${c.degreeField})
  * Relevant Coursework: Algorithms, Relational Databases, Software Engineering
================================================================================
`;
    })
    .join('\n\n');

  return header + '\n' + candidatesText;
}
