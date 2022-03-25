import React, { useRef } from 'react';
import './Collapse.css';

type CollapseTableProps = {
    children: any,
    style: React.CSSProperties,
    tableRef?: React.Ref<HTMLTableElement>
    [x:string]: any
};
const CollapseTable = (props: CollapseTableProps) => {
    const { children, style, tableRef=useRef(null) } = props;

    return (
        <table ref={tableRef} className="collapse-table" style={style}>{children}</table>
    );
};

export { CollapseTableProps }
export default CollapseTable