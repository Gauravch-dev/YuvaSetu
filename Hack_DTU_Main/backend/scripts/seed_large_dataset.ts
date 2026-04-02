
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User';
import CompanyProfile from '../src/models/CompanyProfile';
import Job, { JobStatus } from '../src/models/Job';
import { generateEmbedding } from '../src/services/gemini.service';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/brainwave'; // Fallback
const TARGET_EMAIL = 'jaybanerjee848@gmail.com';
const TARGET_COUNT = 1001;
const BATCH_SIZE = 5; // Max concurrent API calls
const DELAY_MS = 200; // Delay between batches

// --- Job Archetypes (10 Domains) ---
const DOMAINS = {
    "Tech": [
        { title: "Senior Frontend Developer", skill: "React, TypeScript, Tailwind", desc: "Build responsive web apps." },
        { title: "Backend Engineer", skill: "Node.js, Express, MongoDB", desc: "Design scalable APIs." },
        { title: "DevOps Engineer", skill: "AWS, Docker, Kubernetes", desc: "Manage CI/CD pipelines." },
        { title: "Data Scientist", skill: "Python, PyTorch, SQL", desc: "Analyze large datasets." },
        { title: "AI Researcher", skill: "TensorFlow, LLMs, NLP", desc: "Develop new AI models." }
    ],
    "Engineering": [
        { title: "Chemical Process Engineer", skill: "Process Simulation, Aspen, Thermodynamics", desc: "Optimize chemical plant operations." },
        { title: "Civil Engineer", skill: "AutoCAD, Structural Analysis, Project Management", desc: "Oversee construction projects." },
        { title: "Mechanical Design Engineer", skill: "SolidWorks, CAD, Manufacturing", desc: "Design mechanical components." },
        { title: "Electrical Engineer", skill: "Circuit Design, PCB, Embedded Systems", desc: "Develop electronic systems." }
    ],
    "Medical": [
        { title: "Registered Nurse", skill: "Patient Care, CPR, EMR", desc: "Provide patient care in a hospital setting." },
        { title: "Pharmacist", skill: "Prescription Management, Drug Safety", desc: "Dispense medications and advise patients." },
        { title: "Radiologist", skill: "X-ray, MRI, Medical Imaging", desc: "Interpret medical images." }
    ],
    "Business": [
        { title: "Product Manager", skill: "Agile, Roadmap Planning, UX", desc: "Lead product development life cycle." },
        { title: "Business Analyst", skill: "SQL, Excel, Data Visualization", desc: "Identify business needs and solutions." },
        { title: "Project Manager", skill: "PMP, Jira, Risk Management", desc: "Coordinate project timelines and resources." }
    ],
    "Finance": [
        { title: "Chartered Accountant", skill: "Taxation, Auditing, Financial Reporting", desc: "Manage financial records and audits." },
        { title: "Financial Analyst", skill: "Financial Modeling, Forecasting, Excel", desc: "Analyze financial data for investment decisions." },
        { title: "Investment Banker", skill: "Valuation, M&A, Capital Markets", desc: "Advise on corporate finance transactions." }
    ],
    "Legal": [
        { title: "Corporate Lawyer", skill: "Contract Law, Mergers, Negotiation", desc: "Advise corporations on legal rights." },
        { title: "Paralegal", skill: "Legal Research, Drafting, Organization", desc: "Assist lawyers with case preparation." },
        { title: "Compliance Officer", skill: "Regulations, Risk Assessment, Auditing", desc: "Ensure company compliance with laws." }
    ],
    "Education": [
        { title: "High School Math Teacher", skill: "Curriculum Design, Classroom Management", desc: "Teach mathematics to students." },
        { title: "University Professor", skill: "Research, Lecturing, Mentoring", desc: "Teach advanced courses and conduct research." }
    ],
    "Creative": [
        { title: "Graphic Designer", skill: "Adobe Creative Suite, Typography", desc: "Create visual concepts." },
        { title: "Content Writer", skill: "SEO, Copywriting, Blogging", desc: "Write engaging content for web." }
    ],
    "Marketing": [
        { title: "Digital Marketing Manager", skill: "SEO, SEM, Google Analytics", desc: "Plan marketing campaigns." },
        { title: "Sales Executive", skill: "CRM, Negotiation, Lead Generation", desc: "Drive sales and manage client relationships." }
    ],
    "Admin": [
        { title: "HR Manager", skill: "Recruitment, Employee Relations", desc: "Manage human resources." },
        { title: "Office Administrator", skill: "Scheduling, Organization, Communication", desc: "Ensure smooth office operations." }
    ]
};

// --- Helper: Sleep ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function seed() {
    console.log('🌱 Connecting to DB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    // 1. Find User
    const user = await User.findOne({ email: TARGET_EMAIL });
    if (!user) {
        console.error(`❌ User ${TARGET_EMAIL} not found! Please create this user first.`);
        process.exit(1);
    }
    console.log(`found User: ${user.email} (${user._id})`);

    // 2. Find/Create Company Profile
    let company = await CompanyProfile.findOne({ userId: user._id });
    if (!company) {
        console.log('⚠️ Company Profile not found. Creating placeholder...');
        company = await CompanyProfile.create({
            userId: user._id,
            companyName: "Global E-Corp Ltd.",
            website: "https://global-e-corp.example.com",
            description: "A large multinational conglomerate hiring for diverse roles.",
            industry: "Conglomerate",
            location: "Global",
            size: "10000+",
            logoUrl: "https://via.placeholder.com/150"
        });
    }
    console.log(`found Company: ${company.companyName} (${company._id})`);

    // 4. Clean up Old Data (As requested)
    console.log('🧹 Cleaning old jobs for target employer...');
    await Job.deleteMany({ employerId: user._id });
    console.log('✅ Old data deleted.');

    // 5. Generate Job Objects (In Memory)
    console.log('🏗️ Generating Job Objects...');
    const jobs: any[] = [];
    const archetypes = Object.values(DOMAINS).flat();

    // We loop until we reach TARGET_COUNT
    for (let i = 0; i < TARGET_COUNT; i++) {
        const archetype = archetypes[i % archetypes.length]; // Cycle through archetypes
        const variation = Math.floor(i / archetypes.length); // Iteration count

        // Vary the title slightly to make it look real
        const levels = ["Junior", "Senior", "Lead", "Principal", "Intern"];
        const level = levels[variation % levels.length];
        const locations = ["Remote", "Bangalore, India", "Mumbai, India", "Delhi NCR", "Hyderabad, India", "Pune, India"];
        const loc = locations[variation % locations.length];

        const jobTitle = `${level} ${archetype.title}`;

        // Generate INR Salary
        const baseSalary = 300000 + (variation * 100000) + (Math.random() * 50000);
        const maxSalary = baseSalary * 1.5;
        const salaryString = `₹${(baseSalary / 100000).toFixed(1)}L - ₹${(maxSalary / 100000).toFixed(1)}L PA`;

        // Add "Noise" to Description/Requirements to ensure unique vectors
        const uniqueID = Math.random().toString(36).substring(7);
        const noise = `We are looking for a ${level} level candidate. Project ID: ${uniqueID}.`;

        // Randomly mutate skills (remove 1, add 'Git') to vary the vector
        let skillsList = archetype.skill.split(',').map((s: string) => s.trim());
        if (Math.random() > 0.5 && skillsList.length > 1) {
            skillsList.pop(); // Remove last skill
        }
        if (Math.random() > 0.7) {
            skillsList.push("Git"); // Add generic skill
        }
        if (Math.random() > 0.7) {
            skillsList.push("Communication");
        }

        jobs.push({
            employerId: user._id,
            companyProfileId: company._id,
            title: jobTitle,
            type: variation % 3 === 0 ? "Contract" : "Full-time",
            location: loc,
            salary: salaryString,
            description: `${archetype.desc} ${noise} Join our team at ${company.companyName}.`,
            requirements: [
                `Must have experience with ${skillsList.join(', ')}`,
                `${level} level experience required.`,
                "Strong problem-solving skills.",
                `Reference Code: ${uniqueID}` // Unique text ensures unique vector
            ],
            skills: skillsList,
            benefits: ["Health Insurance", "PF", "Remote Options"],
            status: JobStatus.PUBLISHED,
            // Meta for caching (We now INCLUDE level in cache key to differntiate Junior vs Senior)
            _rawDesc: `${archetype.desc} ${level}`,
            _rawSkills: skillsList.join(','),
        });
    }
    console.log(`✅ Generated ${jobs.length} job objects.`);

    // 6. Generate Embeddings (Batch Process)
    console.log('🧠 Generating Embeddings (Precise Mode)...');

    // Cache: Map "ArchetypeDesc + Level + Skills" -> [sVec, eVec, dVec]
    const embeddingCache = new Map<string, any>();

    let processedCount = 0;
    const batchSize = BATCH_SIZE;

    for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize);
        const batchPromises = batch.map(async (job) => {
            // Cache Key includes Skills + Description + Level (implicitly via Title/Desc)
            const cacheKey = job._rawDesc + job._rawSkills;

            if (embeddingCache.has(cacheKey)) {
                const cached = embeddingCache.get(cacheKey);
                job.skillsEmbedding = cached.s;
                job.experienceEmbedding = cached.e;
                job.descriptionEmbedding = cached.d;
                return;
            }

            // Generate
            try {
                const skillsText = `Skills: ${job.skills.join(', ')}`;
                const experienceText = `Requirements: ${job.requirements.join('. ')}`;
                const descText = `Job Title: ${job.title}. Description: ${job.description}`;

                const [sVec, eVec, dVec] = await Promise.all([
                    generateEmbedding(skillsText),
                    generateEmbedding(experienceText),
                    generateEmbedding(descText)
                ]);

                // Store in object
                job.skillsEmbedding = sVec;
                job.experienceEmbedding = eVec;
                job.descriptionEmbedding = dVec;

                // Cache it (Optional: Can comment out if we want 100% unique, but this strikes a balance)
                embeddingCache.set(cacheKey, { s: sVec, e: eVec, d: dVec });

            } catch (err) {
                console.error(`❌ Error generating embedding for ${job.title}:`, err);
                // Non-fatal, just leave empty? Or retry?
            }
        });

        await Promise.all(batchPromises);
        processedCount += batch.length;
        process.stdout.write(`\rProgress: ${processedCount}/${jobs.length} jobs embeded...`);

        await sleep(DELAY_MS); // Throttle
    }
    console.log('\n✅ Embeddings Generated.');

    // 7. Bulk Insert
    console.log('💾 Saving to Database...');

    // Clean up temporary meta fields
    jobs.forEach(j => {
        delete j._rawDesc;
        delete j._rawSkills;
    });

    try {
        await Job.insertMany(jobs);
        console.log(`🎉 Success! Seeded ${jobs.length} jobs for ${TARGET_EMAIL}`);
    } catch (err) {
        console.error('❌ Bulk Insert Failed:', err);
    }

    mongoose.disconnect();
}

seed();
