import { SocialLink } from "./SocialLink";
import { Github, Globe, Linkedin } from "lucide-react";
import { footer, row } from "../styles/Footer.module.scss";

export const Footer = ({ showDivider = true }) => (
    <div className={footer}>
        {showDivider ? <hr /> : null}
        <div>Also find me on:</div>
        <div className={row}>
            <SocialLink
                url="https://daanluttik.nl"
                icon={Globe}
                label="daanluttik.nl"
            />
            <SocialLink
                url="https://github.com/Luttik"
                icon={Github}
                label="Github"
            />
            <SocialLink
                url="https://www.linkedin.com/in/daanluttik/"
                icon={Linkedin}
                label="LinkedIn"
            />
        </div>
    </div>
);
