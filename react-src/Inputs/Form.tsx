import React, { FocusEventHandler, useEffect, useRef, useState } from 'react';
import './Inputs.css';

type DisplayMode = "view" | "edit"
type FormProps = { 
    mode?: DisplayMode,
    innerRef?: React.RefObject<any>,
    title?: string,
    className?: string,
    [x:string]: any
};

const Form = (props: FormProps) => {
    const { mode, innerRef=useRef(), title=null, className, children, ...rest } = props;

    return (
        <form ref={innerRef} className={`form ${className?className:''}`} {...rest} >
            {children}
        </form>
    )
}

export { DisplayMode, FormProps };
export default Form;