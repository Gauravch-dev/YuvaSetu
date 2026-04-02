import { auth } from './firebase';

export const API_BASE_URL = 'http://localhost:5000';

export interface RegisterUserParams {
    idToken: string;
    role: 'JOB_SEEKER' | 'EMPLOYER';
    authProvider?: 'email' | 'google';
}

export interface APIResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    code?: string;
}

export const registerUser = async ({ idToken, role, authProvider }: RegisterUserParams) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken, role, authProvider }),
    });

    const resData: APIResponse = await response.json();

    if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Registration failed');
    }

    return resData.data;
};

export const loginUser = async (idToken: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
    });

    const resData: APIResponse = await response.json();

    if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Login failed');
    }

    return resData.data;
};

export const completeOnboarding = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/onboarding/complete`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    const resData: APIResponse = await response.json();

    if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to update onboarding status');
    }

    return resData.data;
};

export const updateProfile = async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const resData: APIResponse = await response.json();

    if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to update profile');
    }

    return resData.data;
};

export const fetchProtectedData = async (endpoint: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const resData: APIResponse = await response.json();

    if (!response.ok || !resData.success) {
        if (response.status === 403) throw new Error(resData.message || 'Access Denied');
        if (response.status === 401) throw new Error(resData.message || 'Unauthorized');
        throw new Error(resData.message || 'API Error');
    }

    return resData.data;
};

export const checkForgotPassword = async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password-check`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    const resData: APIResponse = await response.json();

    if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Verification failed');
    }

    return resData;
};

export const saveJobSeekerProfile = async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/job-seeker/profile`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const resData: APIResponse = await response.json();

    if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to save profile');
    }

    return resData.data;
};

export const getJobSeekerProfile = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/job-seeker/profile`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    const resData: APIResponse = await response.json();

    if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to fetch profile');
    }

    return resData.data;
};

export const deleteUserAccount = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const resData: APIResponse = await response.json();

    if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to delete account');
    }

    return resData.data;
};

export const updateEmployerProfile = async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/employer/profile`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const resData: APIResponse = await response.json();

    if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to update company profile');
    }

    return resData.data;
};

export const createJob = async (token: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const resData: APIResponse = await response.json();

    if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to create job');
    }

    return resData.data;
};

export const fetchJobs = async (token: string, status?: string) => {
    const url = status
        ? `${API_BASE_URL}/api/jobs/employer?status=${status}`
        : `${API_BASE_URL}/api/jobs/employer`;

    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const resData: APIResponse = await response.json();
    if (!response.ok) throw new Error(resData.message);
    return resData.data;
};

export const updateJob = async (token: string, id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    const resData: APIResponse = await response.json();
    if (!response.ok) throw new Error(resData.message);
    return resData.data;
};

export const deleteJob = async (token: string, id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    const resData: APIResponse = await response.json();
    if (!response.ok) throw new Error(resData.message);
    return resData.data;
};

export const fetchJobById = async (token: string, id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    const resData: APIResponse = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to fetch job');
    return resData.data;
};

export const fetchRecommendedJobs = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/recommendations/jobs`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    const resData: APIResponse = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to fetch recommended jobs');
    return resData.data;
};

export const fetchRecommendedCandidates = async (token: string, jobId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/recommendations/candidates/${jobId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    const resData: APIResponse = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to fetch candidates');
    return resData.data;
};

export const fetchDashboardStats = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/job-seeker/dashboard-stats`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    const resData: APIResponse = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to fetch stats');
    return resData.data;
};

export const fetchEmployerDashboardStats = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/employer/dashboard-stats`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    const resData: APIResponse = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to fetch employer stats');
    return resData.data;
};

export const uploadResumeFile = async (file: File, token: string) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error('Upload failed');
    }
    return response.json();
};

export const fetchCandidateById = async (token: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/employer/candidate/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    const resData: APIResponse = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to fetch candidate');
    return resData.data;
};

export const analyzeSkillGap = async (token: string, jobId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/ondemand/analyze-gap`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
    });
    const resData: APIResponse = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to analyze skill gap');
    return resData.data;
};
