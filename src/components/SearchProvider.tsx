"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import SearchModal from "@/components/SearchModal";

interface SearchContextType {
	isOpen: boolean;
	openSearch: () => void;
	closeSearch: () => void;
}

const SearchContext = createContext<SearchContextType>({
	isOpen: false,
	openSearch: () => {},
	closeSearch: () => {},
});

export const useSearch = () => useContext(SearchContext);

export function SearchProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);

	const openSearch = () => setIsOpen(true);
	const closeSearch = () => setIsOpen(false);

	// Handle Cmd+K / Ctrl+K globally
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				openSearch();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<SearchContext.Provider value={{ isOpen, openSearch, closeSearch }}>
			{children}
			<SearchModal isOpen={isOpen} onClose={closeSearch} />
		</SearchContext.Provider>
	);
}
