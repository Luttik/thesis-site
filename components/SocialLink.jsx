export const SocialLink = ({ url, icon: Icon, label, style = null }) => (
    <div style={style}>
        <a
            href={url}
            style={{ color: "var(--link-blue)", textDecoration: "underline" }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <div style={{ display: "flex" }}>
                    <Icon
                        style={{
                            height: "1em",
                            width: "1em",
                            display: "inline",
                            marginRight: "4pt",
                        }}
                    />
                </div>
                <div style={{ display: "flex" }}>{label}</div>
            </div>
        </a>
    </div>
);
