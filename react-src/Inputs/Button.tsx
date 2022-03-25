import React from 'react';
import './Inputs.css';

type ButtonGroupProps = {
    centered?: boolean,
    children?: any,
    [x:string]: any
}
const ButtonGroup = (props: ButtonGroupProps) => {
    const { centered, children, ...rest } = props;

    return (
        <div className={`btn-group ${centered?'center':''}`}>{children}</div>
    );
}

type ButtonTypes = "button" | "submit" | "reset"
type ButtonProps = {
    type?: ButtonTypes,
    text?: any,
    className?: string,
    children?: any,
    [x:string]: any
}
const Button = (props: ButtonProps) => {
    const { type, text, className='', children, ...rest } = props;

    return (
        <button className={`btn ${className}`} type={type} {...rest}>{children || text}</button>
    );
}

export { ButtonGroupProps, ButtonGroup, ButtonTypes, ButtonProps }
export default Button;