import {config} from '../config'

export const updateRole = async (userId, token, newRole) => {
    try {
      // Make an API call to update the role
      const response = await fetch(`${config.API_URL}/update-role/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`, // Send the token
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newRole }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Role updated successfully: 123", data);
      } else {
        console.error("Failed to update role:", data);
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };