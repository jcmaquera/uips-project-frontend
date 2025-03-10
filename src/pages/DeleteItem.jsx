import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import {
  TextField,
  Button,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const DeleteItem = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [serialNumber, setSerialNumber] = useState(""); // Serial number input state
  const [item, setItem] = useState(null); // To store the item based on serial number
  const [items, setItems] = useState([]); // Items to be displayed in the table
  const [openModal, setOpenModal] = useState(false); // Modal state for confirmation
  const [successMessage, setSuccessMessage] = useState(""); // Success message state

  const navigate = useNavigate();

  // Get User Info
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

  // Fetch Items based on serial number (simulating a server response)
  const fetchItemBySerialNumber = async (serialNumber) => {
    // Simulate a fetch based on the serial number
    const mockData = [
      {
        id: 1,
        serialNumber: "SN123",
        itemType: "Electronics",
        itemDescription: "Smartphone",
        sizeOrSource: "Medium",
        quantity: 100,
      },
      {
        id: 2,
        serialNumber: "SN124",
        itemType: "Furniture",
        itemDescription: "Table",
        sizeOrSource: "Large",
        quantity: 50,
      },
      {
        id: 3,
        serialNumber: "SN125",
        itemType: "Clothing",
        itemDescription: "T-shirt",
        sizeOrSource: "Small",
        quantity: 200,
      },
    ];
    const item = mockData.find((item) => item.serialNumber === serialNumber);
    if (item) {
      setItem(item);
    } else {
      setItem(null);
    }
  };

  // Handle Serial Number Input Change
  const handleSerialNumberChange = (e) => {
    setSerialNumber(e.target.value);
  };

  // Handle Add Item to List
  const handleAddItemToList = () => {
    if (item) {
      setItems([...items, item]);
      setSerialNumber(""); // Clear input field after adding
      setItem(null); // Clear item info
    } else {
      alert("Item not found!");
    }
  };

  // Handle Submit to confirm deletion
  const handleSubmit = () => {
    if (items.length > 0) {
      setOpenModal(true); // Open confirmation modal
    } else {
      alert("No items to delete!");
    }
  };

  // Handle Done button click in modal
  const handleDone = () => {
    // Clear the items table and close the modal
    setItems([]);
    setOpenModal(false); // Close modal
    setSuccessMessage("Items successfully deleted!"); // Show success message

    // Hide success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(""); // Clear success message
    }, 3000);
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  // Column definition for DataGrid (matching your table columns)
  const columns = [
    { field: "itemType", headerName: "Item Type", flex: 1, minWidth: 150 },
    {
      field: "itemDescription",
      headerName: "Item Description",
      flex: 2,
      minWidth: 200,
    },
    {
      field: "sizeOrSource",
      headerName: "Size/Source",
      flex: 1,
      minWidth: 150,
    },
    { field: "quantity", headerName: "Quantity", flex: 1, minWidth: 150 },
    {
      field: "serialNumber",
      headerName: "Serial Number",
      flex: 1,
      minWidth: 150,
    },
  ];

  return (
    <>
      <Navbar userInfo={userInfo} />
      <div style={{ padding: "30px" }}>
        {/* Serial Number Input Field */}
        <Grid
          container
          justifyContent="center"
          style={{ marginBottom: "20px" }}
        >
          <Grid item xs={4}>
            <TextField
              label="Serial Number"
              value={serialNumber}
              onChange={handleSerialNumberChange}
              fullWidth
            />
          </Grid>
        </Grid>

        {/* Add Item Button */}
        <Grid container justifyContent="center" style={{ marginTop: "10px" }}>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddItemToList}
            >
              Add Item
            </Button>
          </Grid>
        </Grid>

        {/* DataGrid Table to Display Items */}
        <div style={{ height: 400, width: "100%", marginTop: "20px" }}>
          <DataGrid
            rows={items}
            columns={columns}
            pageSize={5}
            disableSelectionOnClick
            sx={{
              ".MuiDataGrid-columnHeader": {
                fontWeight: "bold",
              },
              width: "100%",
            }}
          />
        </div>

        {/* Submit Button */}
        <Grid container justifyContent="center" style={{ marginTop: "20px" }}>
          <Grid item>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </Grid>
        </Grid>

        {/* Success Message */}
        {successMessage && (
          <Box
            sx={{
              marginTop: "20px",
              padding: "10px",
              backgroundColor: "#4caf50",
              color: "#fff",
              borderRadius: "5px",
              textAlign: "center",
            }}
          >
            <Typography variant="h6">{successMessage}</Typography>
          </Box>
        )}
      </div>

      {/* Modal for Confirmation */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="h6">
            Are you sure you want to delete the following items?
          </Typography>
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                <strong>{item.itemType}</strong> - {item.itemDescription} -{" "}
                {item.sizeOrSource} - {item.quantity} - {item.serialNumber}
              </li>
            ))}
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDone} color="primary">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteItem;
