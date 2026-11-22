"use client";
import { useEffect } from "react";
import type { Lang } from "./translations";

export function useDocumentLanguage(language: Lang) {
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
}
