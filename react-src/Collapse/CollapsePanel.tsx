import React, { useEffect, useState } from 'react';
import './Collapse.css';

type CollapsePanelProps = {
    open?: boolean,
    onClick?: React.MouseEventHandler<HTMLSpanElement>,
    title: any,
    children: any
};
const CollapsePanel = (props: CollapsePanelProps) => {
    const ref = React.createRef<HTMLDivElement>();
    const [open, setOpen] = useState(props.open);
    const { title, children, onClick } = props;

    useEffect(() => {
        setOpen(props.open);
    }, [props.open]);

    return (
        <div className={`collapse-panel ${open?'open':'closed'}`}>
            <span className="collapse-panel-title" onClick={onClick || (() => setOpen(!open))}>{title}</span>
            <div ref={ref} className="collapse-panel-content">{children}</div>
        </div>
    );
}

export default CollapsePanel;