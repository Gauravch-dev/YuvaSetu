
const API_BASE_URL = 'http://localhost:5000/api';

export const applyJob = async (jobId: string, token: string, resumeUrl?: string) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeUrl })
    });

    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData.message || 'Failed to apply');
    }
    return resData.data;
};

export const fetchMyApplications = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/job-seeker/applications`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData.message || 'Failed to fetch applications');
    }
    return resData.data;
};

export const updateApplicationStatus = async (jobId: string, candidateUserId: string, status: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/candidates/${candidateUserId}/status`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
    });

    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData.message || 'Failed to update status');
    }
    return resData.data;
};

export const fetchJobCandidates = async (jobId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/candidates`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData.message || 'Failed to fetch candidates');
    }
    return resData.data;
};

export const fetchJobAnalytics = async (jobId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/analytics`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData.message || 'Failed to fetch analytics');
    }
    return resData.data;
};
