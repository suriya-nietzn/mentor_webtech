// Seeds demo data. Safe to run many times: it removes only sample records
// (isSample: true) and anything linked to them, then inserts fresh ones.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import env from '../config/env.js';
import User from '../models/User.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Session from '../models/Session.js';
import Message from '../models/Message.js';
import { mentors, students, DEMO_PASSWORD } from './data.js';

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (d, hour = 17) => {
  const date = new Date(Date.now() + d * DAY);
  date.setHours(hour, 0, 0, 0);
  return date;
};

async function run() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`[seed] Connected to ${mongoose.connection.name}`);

  // 1. Clean previous sample data (and anything that points at sample users).
  const oldIds = (await User.find({ isSample: true }).select('_id').lean()).map((u) => u._id);
  const linked = { $or: [{ isSample: true }, { student: { $in: oldIds } }, { mentor: { $in: oldIds } }] };
  await Promise.all([
    MentorshipRequest.deleteMany(linked),
    Session.deleteMany(linked),
    Message.deleteMany({ $or: [{ isSample: true }, { sender: { $in: oldIds } }, { receiver: { $in: oldIds } }] }),
  ]);
  await User.deleteMany({ isSample: true });
  // Remove deleted sample mentors from real students' "recently viewed" lists.
  await User.updateMany({}, { $pull: { recentlyViewedMentors: { $in: oldIds } } });

  // 2. Users. Hash the shared demo password once to keep seeding fast.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const mentorDocs = await User.insertMany(
    mentors.map((m, i) => ({ ...m, email: `mentor${i + 1}@example.com`, role: 'mentor', passwordHash, isSample: true }))
  );
  const studentDocs = await User.insertMany(
    students.map((s, i) => ({ ...s, email: `student${i + 1}@example.com`, role: 'student', passwordHash, isSample: true }))
  );
  // One admin account. Set SEED_ADMIN_PASSWORD in .env to give it its own password.
  await User.create({
    name: 'MentorConnect Admin',
    email: 'admin@example.com',
    role: 'admin',
    college: 'MentorConnect Demo University',
    department: 'Administration',
    passwordHash: process.env.SEED_ADMIN_PASSWORD ? await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12) : passwordHash,
    isSample: true,
  });

  const [ananya, karthik, priya, rahul, meera, arjun, divya, sanjay, fatima, vikram, lavanya, joseph] = mentorDocs;
  const [aisha, rohan, nila, kavya, aditya, sneha, harish, lakshmi, deepak] = studentDocs;

  // Give students a few recently viewed mentors so their dashboards have something to show.
  const viewed = [
    [aisha, [karthik, ananya]],
    [kavya, [fatima, vikram, karthik]],
    [sneha, [rahul, vikram]],
    [lakshmi, [karthik, meera, ananya]],
  ];
  await Promise.all(
    viewed.map(([student, list]) => User.updateOne({ _id: student._id }, { recentlyViewedMentors: list.map((m) => m._id) }))
  );

  // 3. Requests in every status.
  const req = (student, mentor, category, goals, status, extra = {}) => ({
    student: student._id,
    mentor: mentor._id,
    category,
    goals,
    status,
    isSample: true,
    ...(status !== 'pending' ? { respondedAt: daysFromNow(-20) } : {}),
    ...extra,
  });
  const [aishaKarthik, , rohanPriya, , nilaArjun] = await MentorshipRequest.insertMany([
    req(aisha, karthik, 'Web Development', 'I want to build and deploy a full MERN project and get feedback on my code quality.', 'accepted', { mentorResponse: 'Happy to help! Let us start with your project plan.' }),
    req(aisha, ananya, 'Programming', 'I need a structured plan for DSA practice before internship interviews in three months.', 'pending'),
    req(rohan, priya, 'Data Science', 'I would like guidance on my first end-to-end data analysis project using real public datasets.', 'accepted', { mentorResponse: 'Great goal. Bring a dataset you find interesting.' }),
    req(rohan, rahul, 'AI/ML', 'I want to understand deep learning basics and train a small image classifier.', 'rejected', { mentorResponse: 'I am fully booked this month. Please try again next month.' }),
    req(nila, arjun, 'Communication Skills', 'I want mock HR interviews and resume feedback before campus placements start.', 'completed', {
      mentorResponse: 'Accepted. Let us do three mock interviews.',
      completedAt: daysFromNow(-3),
      review: { rating: 5, comment: 'The mock interviews were realistic and the resume feedback was very specific. Sample review (demo content).', createdAt: daysFromNow(-2) },
    }),
    req(nila, meera, 'Communication Skills', 'I want to become more confident presenting my final-year project to a panel.', 'pending'),
  ]);

  const [lakshmiMeera, snehaRahul, adityaFatima] = await MentorshipRequest.insertMany([
    req(lakshmi, meera, 'Communication Skills', 'I get nervous speaking in class and want to practise short talks and group discussions.', 'accepted', { mentorResponse: 'Of course. We will start with two-minute talks.' }),
    req(sneha, rahul, 'AI/ML', 'I want to build an image classifier from scratch and understand each step of training.', 'accepted', { mentorResponse: 'Sounds fun. Install PyTorch before our first call.' }),
    req(aditya, fatima, 'Cybersecurity', 'I want to learn secure coding so my final-year project passes a basic security review.', 'accepted', { mentorResponse: 'Great timing. Share your repository and we will threat-model it.' }),
    req(kavya, vikram, 'AI/ML', 'I want to start a small NLP project on spam detection and learn how to evaluate it properly.', 'pending'),
    req(aditya, divya, 'Cloud & DevOps', 'I want to connect an IoT sensor project to a cloud dashboard and automate deployments.', 'pending'),
    req(lakshmi, ananya, 'Programming', 'I am a first-year student and want a structured plan to get good at problem solving in C++.', 'pending'),
    req(sneha, karthik, 'Web Development', 'I want to build a web front end for my machine learning model so others can try it.', 'rejected', { mentorResponse: 'My weekends are full right now. Please try again next semester.' }),
    req(harish, rahul, 'AI/ML', 'I want to apply machine learning to predictive maintenance data from my mechanical lab.', 'rejected', { mentorResponse: 'Please build Python basics first; Divya or Ananya would be a better start.' }),
  ]);

  const [deepakLavanya] = await MentorshipRequest.insertMany([
    req(deepak, lavanya, 'Mathematics', 'I want to really understand linear algebra, not just memorise steps, before my data science electives.', 'accepted', { mentorResponse: 'Lovely goal. We will start with vectors and build up to eigenvalues.' }),
    req(rohan, joseph, 'Mathematics', 'I want to learn the probability and statistics behind machine learning models.', 'pending'),
    req(kavya, lavanya, 'Mathematics', 'I want to learn number theory and modular arithmetic for cryptography.', 'pending'),
    req(lakshmi, joseph, 'Mathematics', 'I want help with first-year calculus because I am struggling with limits and derivatives.', 'rejected', { mentorResponse: 'Dr. Lavanya runs first-year calculus help and would suit you better. Please ask her.' }),
  ]);

  // Finished mentorships. All but one have a review, giving mentors a realistic spread of ratings.
  const finishedPlan = [
    { student: kavya, mentor: fatima, category: 'Cybersecurity', daysAgo: 30, session: 'CTF walkthrough: web challenges', goals: 'I want to start solving CTF challenges and understand common web vulnerabilities.', rating: 5, comment: 'Explained every vulnerability with a live demo. I solved my first CTF challenge alone after two sessions.' },
    { student: aditya, mentor: sanjay, category: 'Cloud & DevOps', daysAgo: 40, session: 'Deploying with Docker and GitHub Actions', goals: 'I want to containerise my project and set up a simple CI/CD pipeline before placements.', rating: 4, comment: 'Very practical. My project now deploys automatically. I would have liked a bit more time on AWS basics.' },
    { student: sneha, mentor: vikram, category: 'AI/ML', daysAgo: 25, session: 'How to read a research paper', goals: 'I want to understand how to read research papers and whether a research career suits me.', rating: 5, comment: 'Patient and encouraging. The three-pass reading method changed how I study papers.' },
    { student: harish, mentor: divya, category: 'Programming', daysAgo: 18, session: 'C to Python: first automation script', goals: 'I want to move from mechanical engineering to software and need a programming roadmap.', rating: 4, comment: 'Gave me a clear roadmap and weekly tasks. Sessions sometimes ran short, but the feedback was useful.' },
    { student: lakshmi, mentor: karthik, category: 'Web Development', daysAgo: 35, session: 'Build your first portfolio page', goals: 'I want to build and publish my first personal portfolio website using HTML, CSS and JavaScript.', rating: 5, comment: 'My portfolio site is live! Karthik reviewed my code line by line and explained why each change mattered.' },
    { student: rohan, mentor: ananya, category: 'Programming', daysAgo: 22, session: 'Arrays and hashing practice', goals: 'I want to practise coding interview questions on arrays, strings and hashing.', rating: 3, comment: 'Good problem sets, but the pace was fast for a second-year student. Worth it if you already know the basics.' },
    { student: aisha, mentor: meera, category: 'Communication Skills', daysAgo: 45, session: 'Presentation dry run', goals: 'I want to present my mini project clearly and handle questions from the evaluation panel.', rating: 4, comment: 'Recording my practice talks was awkward at first but really helped. My final presentation went well.' },
    { student: harish, mentor: arjun, category: 'Communication Skills', daysAgo: 15, session: 'Resume review and mock interview', goals: 'I want my resume to show my software projects even though my degree is in mechanical engineering.', rating: 4, comment: 'Honest feedback on my resume. The mock interview showed me exactly what to improve.' },
    { student: aditya, mentor: rahul, category: 'AI/ML', daysAgo: 28, session: 'Intro to neural networks', goals: 'I want a quick introduction to machine learning concepts to decide if I should take the elective.', rating: 2, comment: 'Knowledgeable mentor, but two sessions were rescheduled at short notice and we did not finish the plan.' },
    { student: sneha, mentor: priya, category: 'Data Science', daysAgo: 12, session: 'EDA on a public dataset', goals: 'I want to complete one exploratory data analysis project and present the findings clearly.' },
    { student: harish, mentor: lavanya, category: 'Mathematics', daysAgo: 33, session: 'Differential equations: intuition first', goals: 'I want to clear my engineering mathematics backlog and understand differential equations.', rating: 5, comment: 'Finally understood differential equations. She explained each method with a real mechanical example. Cleared my backlog paper.' },
    { student: sneha, mentor: joseph, category: 'Mathematics', daysAgo: 20, session: 'Linear algebra for machine learning', goals: 'I want to understand the linear algebra and calculus used in neural networks.', rating: 4, comment: 'Matrix calculus finally makes sense. The coding exercises after each topic were very useful.' },
    { student: deepak, mentor: joseph, category: 'Mathematics', daysAgo: 14, session: 'Probability puzzles', goals: 'I want to practise probability problems for quantitative internship tests.', rating: 5, comment: 'Fun and challenging problems every session. My probability test score improved a lot.' },
  ];
  const finishedDocs = await MentorshipRequest.insertMany(
    finishedPlan.map((p) =>
      req(p.student, p.mentor, p.category, p.goals, 'completed', {
        mentorResponse: 'Accepted. Looking forward to working with you.',
        respondedAt: daysFromNow(-p.daysAgo - 10),
        completedAt: daysFromNow(-p.daysAgo + 1),
        ...(p.rating
          ? { review: { rating: p.rating, comment: `${p.comment} Sample review (demo content).`, createdAt: daysFromNow(-p.daysAgo + 2) } }
          : {}),
      })
    )
  );

  // 4. Sessions: upcoming, completed and cancelled.
  await Session.insertMany([
    { request: aishaKarthik._id, student: aisha._id, mentor: karthik._id, title: 'Project kickoff: MERN app plan', description: 'Review the feature list and agree on the first milestone.', scheduledAt: daysFromNow(3), durationMinutes: 60, meetingUrl: 'https://meet.example.com/mentorconnect-demo-1', status: 'scheduled', createdBy: karthik._id, isSample: true },
    { request: aishaKarthik._id, student: aisha._id, mentor: karthik._id, title: 'Intro call', description: 'Getting to know each other and setting goals.', scheduledAt: daysFromNow(-10), durationMinutes: 30, status: 'completed', createdBy: karthik._id, isSample: true },
    { request: rohanPriya._id, student: rohan._id, mentor: priya._id, title: 'Choosing a dataset', description: 'Shortlist datasets and define the analysis question.', scheduledAt: daysFromNow(5, 19), durationMinutes: 45, status: 'scheduled', createdBy: rohan._id, isSample: true },
    { request: nilaArjun._id, student: nila._id, mentor: arjun._id, title: 'Mock HR interview #1', description: 'Full-length mock interview with feedback.', scheduledAt: daysFromNow(-8, 11), durationMinutes: 60, status: 'completed', createdBy: arjun._id, isSample: true },
    { request: rohanPriya._id, student: rohan._id, mentor: priya._id, title: 'Statistics refresher', description: 'Mean, variance and distributions before the project starts.', scheduledAt: daysFromNow(-2, 19), durationMinutes: 45, status: 'cancelled', cancelledBy: priya._id, createdBy: priya._id, isSample: true },
    { request: lakshmiMeera._id, student: lakshmi._id, mentor: meera._id, title: 'Two-minute talk practice', description: 'Short talk on a topic of your choice, recorded and reviewed.', scheduledAt: daysFromNow(2, 14), durationMinutes: 30, meetingUrl: 'https://meet.example.com/mentorconnect-demo-2', status: 'scheduled', createdBy: meera._id, isSample: true },
    { request: lakshmiMeera._id, student: lakshmi._id, mentor: meera._id, title: 'Group discussion basics', description: 'How to enter a discussion and summarise points.', scheduledAt: daysFromNow(-4, 15), durationMinutes: 45, status: 'cancelled', cancelledBy: lakshmi._id, createdBy: lakshmi._id, isSample: true },
    { request: snehaRahul._id, student: sneha._id, mentor: rahul._id, title: 'Training loop walkthrough', description: 'Write a PyTorch training loop for a small image dataset.', scheduledAt: daysFromNow(6, 18), durationMinutes: 60, meetingUrl: 'https://meet.example.com/mentorconnect-demo-3', status: 'scheduled', createdBy: sneha._id, isSample: true },
    { request: snehaRahul._id, student: sneha._id, mentor: rahul._id, title: 'Project scoping', description: 'Pick a dataset and agree on a baseline model.', scheduledAt: daysFromNow(-5, 18), durationMinutes: 45, status: 'completed', createdBy: rahul._id, isSample: true },
    { request: adityaFatima._id, student: aditya._id, mentor: fatima._id, title: 'Secure code review: login flow', description: 'Review password storage, sessions and input validation.', scheduledAt: daysFromNow(9, 18), durationMinutes: 60, meetingUrl: 'https://meet.example.com/mentorconnect-demo-4', status: 'scheduled', createdBy: fatima._id, isSample: true },
    { request: adityaFatima._id, student: aditya._id, mentor: fatima._id, title: 'Threat modelling the project', description: 'List assets, entry points and the most likely attacks.', scheduledAt: daysFromNow(-2, 18), durationMinutes: 60, status: 'completed', createdBy: fatima._id, isSample: true },
    { request: deepakLavanya._id, student: deepak._id, mentor: lavanya._id, title: 'Vectors and vector spaces', description: 'Geometric meaning of vectors, span and basis.', scheduledAt: daysFromNow(-6, 15), durationMinutes: 60, status: 'completed', createdBy: lavanya._id, isSample: true },
    { request: deepakLavanya._id, student: deepak._id, mentor: lavanya._id, title: 'Matrices as transformations', description: 'Matrix multiplication, determinants and what they mean visually.', scheduledAt: daysFromNow(4, 15), durationMinutes: 60, meetingUrl: 'https://meet.example.com/mentorconnect-demo-5', status: 'scheduled', createdBy: deepak._id, isSample: true },
    ...finishedDocs.map((r, i) => ({
      request: r._id,
      student: r.student,
      mentor: r.mentor,
      title: finishedPlan[i].session,
      description: 'Hands-on session with follow-up tasks.',
      scheduledAt: daysFromNow(-finishedPlan[i].daysAgo, 17),
      durationMinutes: 60,
      status: 'completed',
      createdBy: r.mentor,
      isSample: true,
    })),
  ]);

  // 5. A short conversation between a connected pair.
  const t = (minsAgo) => new Date(Date.now() - minsAgo * 60 * 1000);
  await Message.insertMany([
    { sender: aisha._id, receiver: karthik._id, text: 'Hi Karthik, thanks for accepting! I have shared my project idea in the session notes.', read: true, createdAt: t(300), isSample: true },
    { sender: karthik._id, receiver: aisha._id, text: 'Looks good. Before Thursday, please sketch the main screens on paper.', read: false, createdAt: t(240), isSample: true },
    { sender: rohan._id, receiver: priya._id, text: 'Hello! Is a Kaggle dataset okay for the first project?', read: false, createdAt: t(60), isSample: true },
    { sender: priya._id, receiver: rohan._id, text: 'Sorry, I had to cancel our statistics session. Can we do the same time next week?', read: true, createdAt: t(2800), isSample: true },
    { sender: lakshmi._id, receiver: meera._id, text: 'Ma’am, can I pick "my favourite app" as the topic for my two-minute talk?', read: true, createdAt: t(1500), isSample: true },
    { sender: meera._id, receiver: lakshmi._id, text: 'Yes, that works well. Keep it to three points and practise once with a timer.', read: false, createdAt: t(1400), isSample: true },
    { sender: sneha._id, receiver: rahul._id, text: 'I have picked the flowers dataset for the classifier. Should I resize the images first?', read: true, createdAt: t(900), isSample: true },
    { sender: rahul._id, receiver: sneha._id, text: 'Yes, 128x128 is fine to start. We will add augmentation later.', read: true, createdAt: t(840), isSample: true },
    { sender: sneha._id, receiver: rahul._id, text: 'Done! Training loss is going down. See you on Friday.', read: false, createdAt: t(120), isSample: true },
    { sender: aditya._id, receiver: fatima._id, text: 'I have shared my repository link. The login code is in the auth folder.', read: true, createdAt: t(3000), isSample: true },
    { sender: fatima._id, receiver: aditya._id, text: 'Thanks. Before our next session, read the OWASP cheat sheet on password storage.', read: false, createdAt: t(2900), isSample: true },
    { sender: kavya._id, receiver: fatima._id, text: 'Thank you for the CTF sessions! I placed in the top 20 at the college contest.', read: true, createdAt: t(20000), isSample: true },
    { sender: deepak._id, receiver: lavanya._id, text: 'Ma’am, I finished the span and basis exercises. Question 4 was tricky but I got it.', read: true, createdAt: t(2000), isSample: true },
    { sender: lavanya._id, receiver: deepak._id, text: 'Well done! Watch a short video on matrices as transformations before Thursday.', read: false, createdAt: t(1900), isSample: true },
  ]);

  // Summary: how many sample records each collection now holds.
  const [users, requests, sessions, messages, reviews] = await Promise.all([
    User.countDocuments({ isSample: true }),
    MentorshipRequest.countDocuments({ isSample: true }),
    Session.countDocuments({ isSample: true }),
    Message.countDocuments({ isSample: true }),
    MentorshipRequest.countDocuments({ isSample: true, 'review.rating': { $exists: true } }),
  ]);
  console.log('[seed] Sample records: %d users (%d mentors, %d students, 1 admin), %d requests, %d sessions, %d reviews, %d messages',
    users, mentorDocs.length, studentDocs.length, requests, sessions, reviews, messages);
  console.log('\n================  DEMO ACCOUNTS (demo only, not real people)  ================');
  console.log(`  Password for every demo account: ${DEMO_PASSWORD}`);
  console.log(`  Admin   : admin@example.com${process.env.SEED_ADMIN_PASSWORD ? ' (password from SEED_ADMIN_PASSWORD)' : ''}`);
  console.log('  Students: student1@example.com ... student9@example.com  (student1 = Aisha, has an accepted mentor)');
  console.log('  Mentors : mentor1@example.com ... mentor12@example.com  (mentor2 = Karthik, has an accepted student)');
  console.log('===============================================================================\n');
}

run()
  .catch((err) => {
    console.error('[seed] Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
