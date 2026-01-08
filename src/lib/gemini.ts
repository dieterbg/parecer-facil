import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy initialization to avoid build-time errors when API key is not set
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not defined");
        }
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

export function getModel() {
    return getGenAI().getGenerativeModel({ model: "gemini-2.5-flash-lite" });
}

// For backwards compatibility - lazy getter
export const model = {
    get instance() {
        return getModel();
    },
    generateContent: async (...args: Parameters<ReturnType<typeof getModel>['generateContent']>) => {
        return getModel().generateContent(...args);
    }
};
