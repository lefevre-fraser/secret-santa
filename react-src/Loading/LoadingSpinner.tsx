import React from 'react'

import './Loading.css';

const LoadingSpinner = (props: any) => {
    return (
        <div className="loading-cover">
            <div className={`loading-spinner ${props.className}`}></div>
        </div>
    )
}

export default LoadingSpinner;