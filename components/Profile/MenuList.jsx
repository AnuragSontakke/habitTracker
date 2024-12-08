import React from "react";
import { View, Text, FlatList, TouchableOpacity, Share, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useUserContext } from "../../contexts/UserContext";

export default function MenuList() {
    const router = useRouter();
    const { signOut } = useAuth();
    const { userRole, userTeacher } = useUserContext();
    // const userHasRole = (role) => {
    //     return user?.publicMetadata?.roles?.includes(role);
    // };
    // Menu list data
    const menuList = [
        {
            id: 1,
            name: "Add Business",
            path: "/business/add-business",
            role: "admin",
            hide: userRole !== "admin" ? true : false,
            icon: "business",
            iconBgColor: "#83a5e6",
        },
        {
            id: 2,
            name: "My Business",
            path: "/business/my-business",
            role: "admin",
            hide: userRole !== "admin" ? true : false,
            icon: "business-outline",
            iconBgColor: "#83c5e6",
        },
        {
            id: 3,
            name: "Share App",
            path: "share",
            icon: "share-social",
            iconBgColor: "#83e684",
        },
        {
            id: 4,
            name: "Members",
            path: "/members/manage-members",
            hide: userRole === "member" ? true: false,
            icon: "people",
            iconBgColor: "#f5e616",
        },
        {
            id: 5,
            name: userRole === "teacher" ? "Requests" : "Join Network",
            path: "/network/join-network",
            hide: userRole === "teacher" || !userTeacher ? false : true,
            icon: userRole === "teacher" ? "apps-outline" : "people",
            iconBgColor: "#83e6b5",
        },
        {
            id: 6,
            name: "Logout",
            path: "logout",
            icon: "log-out-outline",
            iconBgColor: "#f5e616",
        },
    ];

    // Menu click handler
    const onMenuClick = async (item) => {
        if (item.path === "logout") {
            signOut();
            return;
        } else if (item.path === "share") {
            try {
                const result = await Share.share({
                    message: "Download the Habit Share App by Art of Living Volunteers: [App Link]",
                });
                if (result.action === Share.sharedAction) {
                    console.log("App shared successfully");
                }
            } catch (error) {
                console.error("Error sharing the app", error);
            }
            return;
        }
        router.push(item.path);
    };

    // Filtered menu list
    const filteredMenuList = menuList.filter((item) => !item.hide);

    return (
        <View style={{ marginTop: 20 }}>
            <FlatList
                data={filteredMenuList}
                numColumns={2}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => onMenuClick(item)} style={styles.menuItem}>
                        <View style={[styles.iconWrapper, { backgroundColor: item.iconBgColor }]}>
                            <Ionicons name={item.icon} size={30} color="white" />
                        </View>
                        <Text style={styles.menuText}>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Developed with{" "}
                    <Text style={styles.heart}>{" ❤️ "}</Text>
                    By{"\n"}
                    <Text style={styles.footerHighlight}>Anurag Sontakke</Text>
                </Text>
            </View>
        </View>
    );
}

// Styles
const styles = StyleSheet.create({
    menuItem: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "48%",
        margin: 5,
        padding: 10,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderRadius: 15,
        borderColor: Colors.PRIMARY,
    },
    iconWrapper: {
        width: 50,
        height: 50,
        padding: 10,
        borderRadius: 99,
        justifyContent: "center",
        alignItems: "center",
    },
    menuText: {
        marginTop: 10,
        fontFamily: "outfit-medium",
        fontSize: 16,
        textAlign: "center",
    },
    footer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        marginTop: 50,
    },
    footerText: {
        textAlign: "center",
        fontFamily: "outfit-bold",
        fontSize: 12,
        color: Colors.GRAY,
        letterSpacing: 1,
    },
    heart: {
        fontSize: 12,
        color: "#FF69B4",
    },
    footerHighlight: {
        fontSize: 14,
        color: Colors.PRIMARY_LIGHT,
    },
});
