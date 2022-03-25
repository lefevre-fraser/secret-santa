import React, { useEffect } from 'react';

type PageProps = {
    titleRef: React.RefObject<any>
};

const setTitle = (titleRef: React.RefObject<HTMLHeadingElement>, title: any, watch?: Array<any>) => {
    useEffect(() => {
        titleRef.current && (titleRef.current.innerHTML = typeof title === 'function'?title():title);

        return () => {
            titleRef.current && (titleRef.current.innerHTML = 'Title')
        }
    }, [titleRef].concat(watch))
}

export { PageProps, setTitle };