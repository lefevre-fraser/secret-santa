import React from 'react';
import CollapsePanel from './Collapse/CollapsePanel';
import './Collapse/CollapsePanel.css'

class ListItem extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <CollapsePanel open={true} title={<div>Title</div>}>
                <div>Hello World!</div>
            </CollapsePanel>
        );
    }
}

export default ListItem;