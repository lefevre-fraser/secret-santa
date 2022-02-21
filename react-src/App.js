import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Nav from './Nav/Nav'
import NavLink from './Nav/NavLink';
import NavBrand from './Nav/NavBrand';

import HomePage from './Pages/HomePage';
import MyItems from './Pages/MyItems';

class App extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div className="app">
                <Router>
                    <Nav>
                        <NavBrand alt="Nav Brand" src="/santaandreindeer.gif" />
                        <NavLink href="/myitems" link_text="My Items" />
                        <NavLink href="/mygroups" link_text="My Groups" />
                    </Nav>
                    <div className="content">
                        <Routes>
                            <Route path="/">
                                <Route index element={<HomePage />} />
                                <Route path="/myitems" element={<MyItems />} />
                                <Route path="/mygroups" element={<HomePage />} />
                            </Route>
                        </Routes>
                    </div>
                </Router>
            </div>
        )
    }
}

export default App