import React from 'react';
import { Link } from 'react-router-dom'

const NavLink = ({ href, link_text, children }) => {
    return (
        <Link className="nav-link" to={href}>{children || link_text}</Link>
    )
}

export default NavLink