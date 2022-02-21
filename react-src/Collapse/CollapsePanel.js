import React from 'react';
import './CollapsePanel.css';

class CollapsePanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ref: React.createRef(),
            open: this.props.open
        };
    }

    open() {
        this.setState({ open: true });
    }

    close() {
        this.setState({ open: false });
    }

    toggle() {
        const { open } = this.state;
        this.setState({ open: open?false:true });
    }

    render () {
        const { ref, open } = this.state;
        const { onClick, title, children } = this.props;

        return (
            <div className={`collapse-panel ${open?'open':'closed'}`}>
                <span className="collapse-panel-title" onClick={onClick || this.toggle.bind(this)}>{title}</span>
                <div ref={ref} className="collapse-panel-content">{children}</div>
            </div>
        );
    }
}

export default CollapsePanel;