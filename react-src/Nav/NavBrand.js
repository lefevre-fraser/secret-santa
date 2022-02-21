import React from 'react';
import { Link } from 'react-router-dom'

const NavBrand = ({ alt, src }) => {
    return (
        <Link className="nav-brand" to="/">
            <img alt={alt} src={src} />
        </Link>
    )
}

export default NavBrand