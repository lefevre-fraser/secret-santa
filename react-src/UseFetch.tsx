import { useEffect, useState } from 'react';

const useFetch = (url: string, options?: Object) => {
    url = url.replace(/\/+$/, '')
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const abortHandle = new AbortController();

        setTimeout(() => {
            fetch(url, {...options, signal: abortHandle.signal })
                .then((res) => {
                    if (!res.ok) {
                        console.error(`could not fetch data from: ${url}`, options)
                        throw Error(`could not fetch data from: ${url}`)
                    }

                    return res.json();
                }).then((data) => {
                    if (data.error) { setError(data.error); }
                    else if (data.message) { setMessage(data.message); }
                    else { setData(data.data); setError(null); }
                }).catch((err) => {
                    if (err.name==='AbortError') return;
                    setError(err.message);
                })
        }, 10);

        return () => abortHandle.abort();
    }, [url])

    return { data, error, message };
}

export default useFetch;