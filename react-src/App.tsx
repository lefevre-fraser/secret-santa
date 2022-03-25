import React, { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Nav from './Nav/Nav.js'
import NavLink from './Nav/NavLink';
import NavBrand from './Nav/NavBrand.js';

import HomePage from './Pages/HomePage';
import Items from './Pages/Items';

import './App.css'
import Parent from './Test/Test';

const App = () => {
    const TitleRef = useRef(null);

    return (
        <div className="app">
            <Router>
                <Nav>
                    <NavBrand alt="Nav Brand" src="/santaandreindeer.gif" />
                    <NavLink href="/items" link_text="My Items" />
                    <NavLink href="/groups" link_text="My Groups" />
                </Nav>
                <div className="app-content">
                    <h2 ref={TitleRef}></h2>
                    <Routes>
                        <Route path="/">
                            <Route index element={<HomePage titleRef={TitleRef} />} />
                            <Route path="items" element={<Items titleRef={TitleRef} />} />
                            <Route path="items/:groupId/:emailId" element={<Items titleRef={TitleRef} />} />
                            <Route path="groups/" element={<HomePage titleRef={TitleRef} />} />
                            <Route path="groups/:groupId" element={<HomePage titleRef={TitleRef} />} />
                        </Route>
                    </Routes>
                </div>
            </Router>
        </div>
    )
}

export default App