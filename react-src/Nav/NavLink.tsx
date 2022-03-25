import React from 'react';
import { Link } from 'react-router-dom'

type NavLinkProps = { 
    href: string, 
    link_text?: string, 
    children?: any,
    [x:string]: any
};
const NavLink = (props: NavLinkProps) => {
    const { href, link_text, children } = props;

    return (
        <Link className="nav-link" to={href}>{children || link_text}</Link>
    )
}

export { NavLinkProps }
export default NavLink