import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const AddItem = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [itemType, setItemType] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [sizeSource, setSizeSource] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [successMessage, setSuccessMessage] = useState(false); // To control the visibility of the alert

  const navigate = useNavigate();

  // Fetch user info and items on load
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const response = await axiosInstance.get("/get-user");
        if (response.data && response.data.user) {
          setUserInfo(response.data.user);
        }
      } catch (error) {
        if (error.response.status === 401) {
          localStorage.clear();
          navigate("/login");
        }
      }
    };

    const getItems = async () => {
      try {
        const response = await axiosInstance.get("/get-items");
        if (response.data && response.data.items) {
          setItems(response.data.items);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    getUserInfo();
    getItems();
  }, [navigate]);

  const columns = [
    { field: "itemType", headerName: "Item Type", flex: 1, minWidth: 150 },
    {
      field: "itemDesc",
      headerName: "Item Description",
      flex: 2,
      minWidth: 200,
    },
    {
      field: "sizeSource",
      headerName: "Size/Source",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "serialNo",
      headerName: "Serial Number",
      flex: 1,
      minWidth: 150,
    },
  ];

  const itemTypes = [
    "Jacket",
    "P.E. Uniform",
    "Regular Uniform",
    "Scouting",
    "School Supplies",
    "Office Supplies",
    "Books",
    "Graduation",
    "Others",
  ];

  const handleAddItem = async () => {
    if (itemType && itemDesc && sizeSource && serialNo) {
      try {
        const response = await axiosInstance.post("/add-item", {
          itemType,
          itemDesc,
          sizeSource,
          serialNo,
        });

        if (response.status === 200) {
          const newItem = { ...response.data.item, id: response.data.item._id }; // Map _id to id
          setItems([...items, newItem]); // Ensure id exists

          // Clear input fields
          setItemType("");
          setItemDesc("");
          setSizeSource("");
          setSerialNo("");

          setSuccessMessage(true); // Show success message
          setTimeout(() => setSuccessMessage(false), 3000); // Hide after 3 seconds
        } else {
          alert("Error: " + (response.data.message || "Failed to add item"));
        }
      } catch (error) {
        if (error.response) {
          alert(
            "Error: " + (error.response.data.message || "Failed to add item")
          );
        } else if (error.request) {
          alert("Error: No response from server.");
        } else {
          alert("Error: " + error.message);
        }
      }
    } else {
      alert("Please fill all fields!");
    }
  };

  return (
    <>
      <Navbar userInfo={userInfo} />

      {/* Basic Alert message */}
      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage(false)} // Allow user to close the alert manually
          sx={{ marginBottom: "20px" }} // Space between alert and other elements
        >
          Item successfully added!
        </Alert>
      )}

      <div style={{ padding: "30px" }}>
        <Grid
          container
          spacing={3}
          alignItems="center"
          justifyContent="center"
          style={{ marginBottom: "20px" }}
        >
          {/* Input fields */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl fullWidth>
              <InputLabel>Item Type</InputLabel>
              <Select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                fullWidth
              >
                {itemTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              label="Item Description"
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              label="Size/Source"
              value={sizeSource}
              onChange={(e) => setSizeSource(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              label="Serial Number"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              fullWidth
            />
          </Grid>
        </Grid>

        <Grid
          container
          justifyContent="center"
          style={{ marginTop: "10px", marginBottom: "30px" }}
        >
          <Grid item>
            <Button variant="contained" color="primary" onClick={handleAddItem}>
              Add Item
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={items}
            columns={columns}
            pageSize={5}
            disableSelectionOnClick
            getRowId={(row) => row._id} // Ensure unique ID for each row
            sx={{
              ".MuiDataGrid-columnHeader": { fontWeight: "bold" },
              overflowX: "auto", // Make it scrollable on smaller screens
            }}
          />
        </Box>
      </div>
    </>
  );
};

export default AddItem;
