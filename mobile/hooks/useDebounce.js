import { useState, useEffect } from "react";



export function useDebounce(value, delay) {
    const [debounedValue, setDebounedValue] = useState(value);

    useEffect(() => {

        const handler = setTimeout(() => setDebounedValue(value), delay);

        return () => clearTimeout(handler);

    }, [value, delay])


    return debounedValue;
}