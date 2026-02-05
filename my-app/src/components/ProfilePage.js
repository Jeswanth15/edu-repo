import React, { useEffect, useState } from "react";
import { getUserById } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";
import { FaUserCircle, FaEnvelope, FaIdBadge, FaSchool, FaDoorOpen, FaCheckCircle, FaGlobe } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const ProfilePage = () => {
    const { t, i18n } = useTranslation();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const decoded = getDecodedToken();
    const userId = decoded?.userId;

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem("lang", lng);
    };

    useEffect(() => {
        if (!userId) return;

        const fetchProfile = async () => {
            try {
                const res = await getUserById(userId);
                setUserData(res.data);
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                // adding slight delay for smooth transition
                setTimeout(() => setLoading(false), 600);
            }
        };

        fetchProfile();
    }, [userId]);

    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(" ").map(n => n[0]).join("").toUpperCase();
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div className="spinner"></div>
                <p style={{ marginTop: "20px", color: "var(--text-secondary)", fontWeight: "500" }}>
                    {t("preparing")}
                </p>
            </div>
        );
    }

    return (
        <div style={styles.contentWrapper} className="fade-in">
            <div className="premium-card" style={styles.profileHeader}>
                <div style={styles.avatarSection}>
                    <div style={styles.avatar}>
                        {getInitials(userData?.name)}
                    </div>
                    <div style={styles.headerInfo}>
                        <h1 style={styles.userName}>{userData?.name}</h1>
                        <p style={styles.userRole}>{userData?.role}</p>
                    </div>
                </div>
                <div style={styles.statusSection}>
                    <span className={`status-tag status-${userData?.approvalStatus?.toLowerCase()}`}>
                        <FaCheckCircle style={{ marginRight: 6 }} />
                        {userData?.approvalStatus}
                    </span>
                </div>
            </div>

            <div style={styles.detailsGrid}>
                <div className="premium-card" style={styles.infoCard}>
                    <h3 style={styles.cardTitle}>{t("personal_info")}</h3>
                    <div style={styles.infoList}>
                        <div style={styles.infoItem}>
                            <FaEnvelope style={styles.icon} />
                            <div>
                                <label style={styles.label}>{t("email_placeholder")}</label>
                                <p style={styles.value}>{userData?.email}</p>
                            </div>
                        </div>
                        <div style={styles.infoItem}>
                            <FaIdBadge style={styles.icon} />
                            <div>
                                <label style={styles.label}>User ID</label>
                                <p style={styles.value}>#{userData?.userId}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="premium-card" style={styles.infoCard}>
                    <h3 style={styles.cardTitle}>{t("academic_affiliation")}</h3>
                    <div style={styles.infoList}>
                        <div style={styles.infoItem}>
                            <FaSchool style={styles.icon} />
                            <div>
                                <label style={styles.label}>School ID</label>
                                <p style={styles.value}>{userData?.schoolId || "Global Administrator"}</p>
                            </div>
                        </div>
                        {userData?.classroomId && (
                            <div style={styles.infoItem}>
                                <FaDoorOpen style={styles.icon} />
                                <div>
                                    <label style={styles.label}>Classroom ID</label>
                                    <p style={styles.value}>{userData?.classroomId}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="premium-card" style={styles.actionCard}>
                <h3 style={styles.cardTitle}>{t("account_settings")}</h3>

                <div style={{ marginBottom: "32px" }}>
                    <label style={styles.label}><FaGlobe style={{ marginRight: "8px" }} /> {t("language")}</label>
                    <div style={styles.langSwitch}>
                        <button
                            className={`modern-btn ${i18n.language === 'en' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => changeLanguage('en')}
                            style={{ flex: 1 }}
                        >
                            {t("english")}
                        </button>
                        <button
                            className={`modern-btn ${i18n.language === 'ta' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => changeLanguage('ta')}
                            style={{ flex: 1 }}
                        >
                            {t("tamil")}
                        </button>
                    </div>
                </div>

                <p style={styles.textMuted}>Currently, profile editing is handled by your school administrator.</p>
                <div style={styles.buttonGroup}>
                    <button className="modern-btn btn-outline">{t("change_password")}</button>
                    <button className="modern-btn btn-outline">{t("request_update")}</button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    contentWrapper: {
        maxWidth: "1000px",
        margin: "0 auto",
        paddingBottom: "40px",
    },
    profileHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "32px",
        padding: "40px",
        background: "linear-gradient(135deg, #0c4a6e 0%, #075985 100%)",
        color: "white",
        border: "none",
    },
    avatarSection: {
        display: "flex",
        alignItems: "center",
        gap: "24px",
    },
    avatar: {
        width: "100px",
        height: "100px",
        background: "rgba(255, 255, 255, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        fontSize: "36px",
        fontWeight: "700",
        fontFamily: "'Outfit', sans-serif",
        border: "3px solid rgba(255, 255, 255, 0.4)",
    },
    headerInfo: {
        display: "flex",
        flexDirection: "column",
    },
    userName: {
        color: "white",
        fontSize: "32px",
        fontWeight: "800",
        marginBottom: "4px",
        letterSpacing: "-0.5px",
    },
    userRole: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: "16px",
        fontWeight: "600",
        margin: 0,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
    },
    detailsGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        marginBottom: "32px",
    },
    infoCard: {
        padding: "24px",
    },
    cardTitle: {
        fontSize: "14px",
        fontWeight: "700",
        marginBottom: "20px",
        borderBottom: "1px solid var(--border-color)",
        paddingBottom: "12px",
        textTransform: "uppercase",
        letterSpacing: "1px",
        color: "var(--text-muted)",
    },
    infoList: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    infoItem: {
        display: "flex",
        gap: "16px",
        alignItems: "flex-start",
    },
    icon: {
        color: "var(--primary-color)",
        fontSize: "20px",
        marginTop: "4px",
        opacity: 0.8,
    },
    label: {
        fontSize: "11px",
        color: "var(--text-muted)",
        fontWeight: "700",
        textTransform: "uppercase",
        display: "block",
        marginBottom: "4px",
        letterSpacing: "0.5px",
    },
    value: {
        fontSize: "16px",
        color: "var(--text-primary)",
        fontWeight: "600",
        margin: 0,
    },
    actionCard: {
        padding: "24px",
    },
    textMuted: {
        color: "var(--text-secondary)",
        fontSize: "15px",
        marginBottom: "20px",
        lineHeight: "1.6",
    },
    buttonGroup: {
        display: "flex",
        gap: "12px",
    },
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
    },
    langSwitch: {
        display: "flex",
        gap: "12px",
        marginTop: "12px",
    }
};

export default ProfilePage;
