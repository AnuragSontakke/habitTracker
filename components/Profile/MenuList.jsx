import { View, Text, FlatList, TouchableOpacity, Share } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function MenuList() {
    const router = useRouter();
    const { signOut, user } = useAuth();

    // Check if user has a specific role
    const userHasRole = (role) => {
        return user?.publicMetadata?.roles?.includes(role);
    };

    // Menu List Data
    const menuList = [
        {
            id: 1,
            name: "Add Business",
            icon: (
                <Ionicons
                    name="business"
                    size={30}
                    color="white"
                    backgroundColor={"#83a5e6"}
                    style={{
                        width: 50,
                        height: 50,
                        padding: 10,
                        borderRadius: 99,
                    }}
                />
            ),
            path: "/business/add-business",
            role: "admin",
        },
        {
            id: 2,
            name: "My Business",
            icon: (
                <Ionicons
                    name="business-outline"
                    size={30}
                    color="white"
                    backgroundColor={"#83c5e6"}
                    style={{
                        width: 50,
                        height: 50,
                        padding: 10,
                        borderRadius: 99,
                    }}
                />
            ),
            path: "/business/my-business",
            role: "admin",
        },
        {
            id: 3,
            name: "Share App",
            icon: (
                <Ionicons
                    name="share-social"
                    size={30}
                    color="white"
                    backgroundColor={"#83e684"}
                    style={{
                        width: 50,
                        height: 50,
                        padding: 10,
                        borderRadius: 99,
                    }}
                />
            ),
            path: "share",
        },
        {
            id: 3,
            name: "Members",
            icon: (
                <Ionicons
                    name="share-social"
                    size={30}
                    color="white"
                    backgroundColor={"#83e684"}
                    style={{
                        width: 50,
                        height: 50,
                        padding: 10,
                        borderRadius: 99,
                    }}
                />
            ),
            path: "/members/manage-members",
        },
        {
            id: 4,
            name: "Join Network",
            icon: (
                <Ionicons
                    name="share-social"
                    size={30}
                    color="white"
                    backgroundColor={"#83e684"}
                    style={{
                        width: 50,
                        height: 50,
                        padding: 10,
                        borderRadius: 99,
                    }}
                />
            ),
            path: "/network/join-network",
        },
        {
            id: 5,
            name: "Logout",
            icon: (
                <MaterialIcons
                    name="logout"
                    size={30}
                    color="white"
                    backgroundColor={"#f5e616"}
                    style={{
                        width: 50,
                        height: 50,
                        padding: 10,
                        borderRadius: 99,
                    }}
                />
            ),
            path: "logout",
        },
    ];

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
                    if (result.activityType) {
                        console.log("Shared with activity type: " + result.activityType);
                    } else {
                        console.log("App shared successfully");
                    }
                } else if (result.action === Share.dismissedAction) {
                    console.log("Share dismissed");
                }
            } catch (error) {
                console.error("Error sharing the app", error);
            }
            return;
        }
        router.push(item.path);
    };

    // Filter menu items based on user role
    const filteredMenuList = menuList.filter(
        (item) => !item.role || userHasRole(item.role)
    );

    return (
        <View style={{ marginTop: 20 }}>
            <FlatList
                data={filteredMenuList}
                numColumns={2}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => onMenuClick(item)}
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                            flex: 1,
                            padding: 10,
                            borderWidth: 1,
                            borderRadius: 15,
                            margin: 10,
                            backgroundColor: "#fff",
                            borderColor: Colors.PRIMARY,
                        }}
                    >
                        {item.icon}
                        <Text style={{ fontFamily: "outfit-medium", fontSize: 16, flex: 1 }}>
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            <View
                style={{
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 10,
                    marginTop: 200,
                }}
            >
                <Text
                    style={{
                        textAlign: "center",
                        fontFamily: "outfit-bold",
                        fontSize: 12,
                        color: Colors.GRAY,
                        letterSpacing: 1,
                        transform: [{ scale: 1.05 }],
                    }}
                >
                    Developed with{" "}
                    <Text
                        style={{
                            fontSize: 12,
                            color: "#FF69B4",
                        }}
                    >
                        {" ❤️ "}
                    </Text>
                    By{" "}
                    {"\n"} {/* New line */}
                    <Text style={{ fontSize: 14, color: Colors.PRIMARY_LIGHT }}>
                        Anurag Sontakke
                    </Text>
                </Text>
            </View>
        </View>
    );
}
