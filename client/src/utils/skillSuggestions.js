// Skills suggested for each department in DEPARTMENTS (see constants.js).
// These are only suggestions: people can still type any skill.
export const SKILLS_BY_DEPARTMENT = {
  Programming: ['Python', 'Java', 'C', 'C++', 'JavaScript', 'Data Structures', 'Algorithms', 'OOP', 'Git', 'Problem Solving'],
  'Web Development': ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'REST APIs', 'Tailwind CSS'],
  'Data Science': ['Python', 'Pandas', 'NumPy', 'SQL', 'Statistics', 'Data Visualization', 'Excel', 'Power BI', 'Tableau', 'Machine Learning'],
  'AI/ML': ['Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'NLP', 'Computer Vision', 'Statistics', 'Linear Algebra'],
  'Communication Skills': ['Public Speaking', 'Presentation Skills', 'Technical Writing', 'Group Discussion', 'Interview Skills', 'Email Etiquette', 'Storytelling', 'Active Listening'],
  'Cloud & DevOps': ['AWS', 'Azure', 'Docker', 'Kubernetes', 'Linux', 'CI/CD', 'Terraform', 'Jenkins', 'Bash', 'Git'],
  Cybersecurity: ['Network Security', 'Web Security', 'Ethical Hacking', 'Penetration Testing', 'Cryptography', 'OWASP', 'Wireshark', 'Kali Linux', 'Linux', 'Python'],
  Mathematics: ['Calculus', 'Linear Algebra', 'Probability', 'Statistics', 'Discrete Mathematics', 'Differential Equations', 'Numerical Methods', 'Optimisation', 'MATLAB', 'LaTeX'],
  'Computer Science': ['Data Structures', 'Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks', 'OOP', 'Java', 'C++', 'Python', 'SQL'],
  'Information Technology': ['Networking', 'SQL', 'DBMS', 'Java', 'Python', 'Linux', 'Cloud Computing', 'Web Development', 'Git', 'IT Support'],
};

// Shown before a department is chosen, or for a department not in the list.
const POPULAR = ['Python', 'Java', 'JavaScript', 'React', 'SQL', 'Machine Learning', 'Public Speaking', 'Git'];

// Every known skill, used for Tab completion even outside the chosen department.
export const ALL_SKILLS = [...new Set(Object.values(SKILLS_BY_DEPARTMENT).flat())];

// Suggestions for a department. Matches typed variants like "computer science and engineering".
export function skillSuggestions(department) {
  const dept = String(department || '').trim().toLowerCase();
  if (dept) {
    const key =
      Object.keys(SKILLS_BY_DEPARTMENT).find((k) => k.toLowerCase() === dept) ||
      Object.keys(SKILLS_BY_DEPARTMENT).find((k) => dept.includes(k.toLowerCase()));
    if (key) return { title: `Suggested for ${key}`, skills: SKILLS_BY_DEPARTMENT[key] };
  }
  return { title: 'Popular skills', skills: POPULAR };
}
