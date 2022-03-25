import React, { FocusEventHandler, useEffect, useRef, useState } from 'react';
import './Inputs.css';

type InputType = "text" | "number" | "textarea" 
type DisplayMode = "view" | "edit"
type InputProps = { 
    mode?: DisplayMode, 
    type?: InputType, 
    innerRef?: React.RefObject<any>, 
    hidden?: boolean,
    title?: string,
    value?: any,
    inline?: boolean,
    onBlur?: FocusEventHandler<HTMLElement>
    [x:string]: any
};

const TextInput = React.forwardRef<HTMLInputElement, InputProps>((props: InputProps, ref) => {
    const { mode, hidden, type, value, ...rest } = props;

    return (
        <>
            { mode==="edit" && <input ref={ref} type="text" value={value} {...rest} /> }
            { mode==="view" && <div ref={ref} {...rest}>{value}</div> }
        </>
    )
})

const NumberInput = React.forwardRef<HTMLInputElement, InputProps>((props: InputProps, ref) => {
    const { mode, hidden, type, value, ...rest } = props;

    return (
        <>
            { mode==="edit" && <input ref={ref} type="number" value={value} {...rest} /> }
            { mode==="view" && <div ref={ref} {...rest}>{value}</div> }
        </>
    )
})

const TextAreaInput = React.forwardRef<any, InputProps>((props: InputProps, ref) => {
    const { mode, hidden, type, value, ...rest } = props;

    return (
        <>
            { mode==="edit" && <textarea ref={ref} {...rest} value={value}></textarea> }
            { mode==="view" && <div ref={ref} {...rest}>{value}</div> }
        </>
    )
})

type TypeMap = {
    [x in InputType]: Function;
};
const TypeMappings: TypeMap = {
    "text": TextInput,
    "number": NumberInput,
    "textarea": TextAreaInput
}
const Input = (props: InputProps) => {
    const [value, setValue] = useState(props.value);
    const { type, innerRef=useRef(null), hidden=false, 
        title=null, value: initialvalue, inline, ...rest
    } = props;
    const InputFunc = TypeMappings[type];

    useEffect(() => {
        // console.log(value);
    }, [value])

    return (
        <div className={`form-group ${hidden?'hidden':''} ${inline?'inline':''}`}>
            { title && <label className="form-input-label" title={title}>{title}:</label> }
            { <InputFunc {...rest} ref={innerRef} className="form-input-data" value={value} onChange={() => setValue(innerRef.current.value)} /> }
        </div>
    )
}

export { InputType, DisplayMode, InputProps };
export default Input;