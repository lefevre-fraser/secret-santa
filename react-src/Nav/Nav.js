import React from 'react';
import './Nav.css'

class Nav extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoggedIn: false
        };
    }

    render() {
        return (
            <div className="nav">{this.props.children}</div>
        );
    }
}

export default Nav;