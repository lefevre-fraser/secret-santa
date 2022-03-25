import React, { useRef } from 'react';
import ListItem from './ListItem';
import CollapseTable from '../Collapse/CollapseTable'

type ItemListProps = {
    items: Array<any>,
    [x:string]: any
}
const ItemList = (props: ItemListProps) => {
    const { items } = props;
    const collapseRefs: { [x:string]: React.RefObject<ListItem> } = {};

    const closeCollapsePanels = () => {
        for (const ref of Object.values(collapseRefs)) {
            ref.current.setState({ open: false })
        }
    }

    return (
        <CollapseTable style={{ "--ss-ct-grid-template-columns": `repeat(${1}, 200px) auto` } as React.CSSProperties}>
            <thead><tr><th>Title</th><th>Description <a href=";;javascript" style={{ float: 'right' }} onClick={(e) => { e.preventDefault(); closeCollapsePanels(); }}>[collapse]</a><div style={{ clear: 'both' }} /></th></tr></thead>
            <tbody>{ items.map((item) => <ListItem ref={collapseRefs[item.id]=React.createRef()} key={item.id} item={item} />) }</tbody>
        </CollapseTable>
    );
}

export { ItemListProps }
export default ItemList