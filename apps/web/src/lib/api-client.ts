import { redirect } from "@tanstack/react-router";
import Axios, { type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
	if (config.headers) {
		config.headers.Accept = "application/json";
	}

	config.withCredentials = true;
	return config;
}

export const api = Axios.create({
	baseURL: import.meta.env.VITE_APP_API_URL,
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		const message = error.response?.data?.message || error.message;
		toast.error(message);
		if (error.response?.status === 401) {
			throw redirect({ to: "/" });
		}
		return Promise.reject(error);
	},
);
