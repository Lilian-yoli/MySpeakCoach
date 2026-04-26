import { useState, useCallback } from 'react';
import { API_BASE } from '../config.js';
const TOKEN_KEY = 'myspeak_token';
const USER_KEY  = 'myspeak_user';

export function useAuth() {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [user,  setUser]  = useState(() => {
        const stored = localStorage.getItem(USER_KEY);
        return stored ? JSON.parse(stored) : null;
    });

    const persist = (token, user) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setToken(token);
        setUser(user);
    };

    const register = useCallback(async (account, password) => {
        const res  = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account, password }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        persist(json.token, json.user);
    }, []);

    const login = useCallback(async (account, password) => {
        const res  = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account, password }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        persist(json.token, json.user);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
    }, []);

    return { token, user, isLoggedIn: !!token, login, register, logout };
}

/** 供其他 hooks 取得 Authorization header */
export const getAuthHeader = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
};
