import AxiosMockAdapter from 'axios-mock-adapter';
import axios from 'axios';

// Initialize the mock adapter on the default axios instance
const mock = new AxiosMockAdapter(axios, { delayResponse: 500 }); // 500ms delay to simulate network

// --- Mock Data ---

const users = [
    { id: 1, email: 'student@test.com', password: '123', name: 'Student User', role: 'student', is_active: 1 },
    { id: 2, email: 'admin@test.com', password: '123', name: 'Admin User', role: 'admin', is_active: 1 },
    { id: 3, email: 'inactive@test.com', password: '123', name: 'Inactive User', role: 'student', is_active: 0 }
];

let lessons = [
    { id: 1, title: 'Welcome to Alexandria', description: 'Introduction to the mentorship program.', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', material_link: 'https://example.com/material1.pdf', order_index: 0 },
    { id: 2, title: 'Chapter 1: Foundations', description: 'Building the solid base for your career.', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', material_link: '', order_index: 1 },
    { id: 3, title: 'Chapter 2: Advanced Concepts', description: 'Deep dive into complex topics.', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', material_link: 'https://example.com/material2.zip', order_index: 2 }
];

let library = [
    { id: 1, title: 'Clean Code PDF', file_path: '#', created_at: '2023-01-15 10:00:00' },
    { id: 2, title: 'The Pragmatic Programmer', file_path: '#', created_at: '2023-01-20 14:30:00' }
];

let events = [
    { id: 1, title: 'Monthly Mentorship Q&A', description: 'Live Q&A session with mentors.', event_start: new Date(Date.now() + 86400000 * 2).toISOString(), event_end: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString() },
    { id: 2, title: 'Vue.js Workshop', description: 'Deep dive into Composition API.', event_start: new Date(Date.now() + 86400000 * 5).toISOString(), event_end: new Date(Date.now() + 86400000 * 5 + 7200000).toISOString() }
];

let settings = {
    live_meeting_url: 'https://meet.google.com/mock-meeting-id'
};

// --- Route Handlers ---

// Login
mock.onPost('/login.php').reply(config => {
    const { email, password } = JSON.parse(config.data);
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        return [200, {
            success: true,
            user_id: user.id,
            is_active: user.is_active,
            role: user.role
        }];
    } else {
        return [401, { success: false, message: 'Invalid credentials. Try admin@test.com / 123' }];
    }
});

// Register
mock.onPost('/register.php').reply(config => {
    const { email, password, name } = JSON.parse(config.data);
    if (users.find(u => u.email === email)) {
        return [409, { error: 'Email already registered' }];
    }
    const newUser = { id: users.length + 1, email, password, name, role: 'student', is_active: 0 };
    users.push(newUser);
    return [200, { success: true, message: 'User registered successfully' }];
});

// Get Lessons
mock.onGet(/\/get_lessons\.php/).reply(config => {
    // Check auth simulation
    // In real app we check session/token, here we just pass
    return [200, lessons];
});

// Get Live Link
mock.onGet('/get_live_link.php').reply(200, { url: settings.live_meeting_url });

// Get Library
mock.onGet(/\/get_library\.php/).reply(200, library);

// Get Events
mock.onGet(/\/get_events\.php/).reply(200, events);

// Admin: Update Link
mock.onPost('/update_link.php').reply(config => {
    const { link } = JSON.parse(config.data);
    settings.live_meeting_url = link;
    return [200, { success: true, message: 'Link updated' }];
});

// Admin: Update Lesson
mock.onPost('/update_lesson.php').reply(config => {
    const data = JSON.parse(config.data);
    const lessonIndex = lessons.findIndex(l => l.id === data.lesson_id);
    if (lessonIndex > -1) {
        lessons[lessonIndex] = { ...lessons[lessonIndex], ...data };
        return [200, { success: true, message: 'Lesson updated' }];
    }
    return [404, { error: 'Lesson not found' }];
});

// Admin: Upload Library
mock.onPost('/upload_library.php').reply(config => {
    // Cannot parse FormData easily in mock adapter simple JSON parse,
    // but we can simulate success.
    const newId = library.length + 1;
    const newItem = {
        id: newId,
        title: 'Uploaded Document ' + newId,
        file_path: '#',
        created_at: new Date().toISOString()
    };
    library.unshift(newItem);
    return [200, { success: true, message: 'File uploaded', url: '#' }];
});

export default mock;
