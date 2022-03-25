import React from 'react';
import useFetch from '../UseFetch.tsx';
import CollapsePanel from '../Collapse/CollapsePanel';
import '../Collapse/Collapse.css'
import Item from './Item.tsx';

class ListItem extends React.Component {
    constructor(props) {
        super(props);
        const { item, open=false } = this.props;
        this.state = { item, open };
    }

    createTitle() {
        const { title, description } = this.state.item;
        return <tr><td>{title}</td><td>{description}</td></tr>
    }

    render() {
        const { item, open } = this.state;

        return (
            <CollapsePanel open={open} title={this.createTitle()} onClick={() => this.setState({ open: !open })}>
                <Item item={item} showDelete={true} showEdit={true} />
            </CollapsePanel>
        );
    }
}

export default ListItem;