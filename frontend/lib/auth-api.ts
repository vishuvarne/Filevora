// API client for frontend authentication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://filevora.onrender.com';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

class AuthAPI {
    private getHeaders(includeAuth: boolean = false): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = localStorage.getItem('access_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }

        const authResponse: AuthResponse = await response.json();

        // Store token
        localStorage.setItem('access_token', authResponse.access_token);
        localStorage.setItem('user', JSON.stringify(authResponse.user));

        return authResponse;
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const authResponse: AuthResponse = await response.json();

        // Store token
        localStorage.setItem('access_token', authResponse.access_token);
        localStorage.setItem('user', JSON.stringify(authResponse.user));

        return authResponse;
    }

    async getCurrentUser(): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            headers: this.getHeaders(true),
        });

        if (!response.ok) {
            throw new Error('Failed to get current user');
        }

        return response.json();
    }

    async logout(): Promise<void> {
        try {
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: this.getHeaders(true),
            });
        } finally {
            // Always clear local storage
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
        }
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('access_token');
    }

    getStoredUser(): User | null {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;

        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }
}

export const authAPI = new AuthAPI();
