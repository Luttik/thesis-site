import React from "react";
import { progressBar, highlight } from "../styles/ProgressBar.module.scss";

export default class ProgressBar extends React.Component {
    componentDidMount() {
        document.addEventListener("scroll", this.onScroll);
    }

    componentWillUnmount() {
        document.removeEventListener("scroll", this.onScroll);
    }

    onScroll = () => {
        const scrollPx = document.documentElement.scrollTop;
        const winHeightPx =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight;

        this.setState({
            scrolled: `${(scrollPx / winHeightPx) * 100}%`,
        });
    };

    render = () => (
        <>
            <div className={progressBar}>
                <div
                    className={highlight}
                    style={{ width: this.state ? this.state.scrolled : "0" }}
                ></div>
            </div>
        </>
    );
}
