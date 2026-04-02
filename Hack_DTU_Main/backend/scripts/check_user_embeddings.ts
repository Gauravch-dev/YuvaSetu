
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

import JobSeekerProfile from '../src/models/JobSeekerProfile';
import User from '../src/models/User';

const verifyEmbeddings = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Connected to MongoDB');

        // Find the user (assuming the one logged in matches the seeder or generic)
        // We'll check the most recent JobSeeker
        const user = await User.findOne({ role: 'JOB_SEEKER' }).sort({ _id: -1 });

        if (!user) {
            console.log("❌ No Job Seeker found.");
            return;
        }

        console.log(`Checking Profile for User: ${user.email} (${user._id})`);

        const profile = await JobSeekerProfile.findOne({ userId: user._id }).select('+skillsEmbedding +experienceEmbedding +bioEmbedding');

        if (!profile) {
            console.log("❌ Profile not found.");
            return;
        }

        console.log("--- Embedding Status ---");
        console.log(`Skills Vector Exists: ${!!profile.skillsEmbedding}`);
        console.log(`Skills Vector Length: ${profile.skillsEmbedding?.length || 0}`);

        console.log(`Experience Vector Exists: ${!!profile.experienceEmbedding}`);
        console.log(`Bio Vector Exists: ${!!profile.bioEmbedding}`);

        if (profile.skillsEmbedding && profile.skillsEmbedding.length > 0) {
            console.log("\n✅ SUCCESS: Embeddings are persisted in DB.");
        } else {
            console.log("\n❌ FAILURE: Embeddings are MISSING from DB.");
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyEmbeddings();
