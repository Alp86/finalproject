import React from "react";
import ProfilePic from "./ProfilePic";
import { Link } from 'react-router-dom';

export default function Header ({data}) {

    return (
        <div className="header">

            <h1>The Network</h1>

            <Link to="/findpeople">
                <h3>Find People</h3>
            </Link>

            <Link to="/">
                <ProfilePic
                    id={data.id}
                    first={data.first}
                    last={data.last}
                    url={data.url}
                />
            </Link>
        </div>
    );
}
