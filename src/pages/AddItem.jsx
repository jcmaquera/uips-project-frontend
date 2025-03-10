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

const AddItem = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [itemType, setItemType] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [sizeOrSource, setSizeOrSource] = useState("");
  const [quantity, setQuantity] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [deliveryNumber, setDeliveryNumber] = useState(""); // Delivery Number state
  const [openModal, setOpenModal] = useState(false); // Modal open state
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

  useEffect(() => {
    getUserInfo();
  }, []);

  // Column definition for DataGrid
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

  // Handle form submission (adding new item)
  const handleAddItem = () => {
    if (
      itemType &&
      itemDescription &&
      sizeOrSource &&
      quantity &&
      serialNumber
    ) {
      const newItem = {
        id: items.length + 1, // Generate unique ID
        itemType,
        itemDescription,
        sizeOrSource,
        quantity,
        serialNumber,
      };

      setItems([...items, newItem]);

      // Clear form fields after adding
      setItemType("");
      setItemDescription("");
      setSizeOrSource("");
      setQuantity("");
      setSerialNumber("");
    } else {
      alert("Please fill all fields!");
    }
  };

  // Handle the Submit button click
  const handleSubmit = () => {
    if (items.length > 0) {
      setOpenModal(true); // Open modal if there are items
    } else {
      alert("No items to submit!");
    }
  };

  // Handle Done button click in modal
  const handleDone = () => {
    // Clear the items table and close the modal
    setItems([]);
    setDeliveryNumber(""); // Reset Delivery Number
    setOpenModal(false); // Close modal
    setSuccessMessage("Items successfully submitted!"); // Show success message

    // Hide success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(""); // Clear success message
    }, 3000);
  };

  return (
    <>
      <Navbar userInfo={userInfo} />
      <div style={{ padding: "30px" }}>
        {/* Form Inputs */}
        <Grid
          container
          spacing={3}
          alignItems="center"
          justifyContent="center"
          style={{ marginBottom: "20px" }}
        >
          <Grid item xs={2}>
            <TextField
              label="Item Type"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              label="Item Description"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              label="Size/Source"
              value={sizeOrSource}
              onChange={(e) => setSizeOrSource(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              label="Serial Number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              fullWidth
            />
          </Grid>
        </Grid>

        {/* Add Button aligned with Input Fields */}
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

      {/* Modal for Summary and Delivery Number */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Item Summary</DialogTitle>
        <DialogContent>
          <div>
            <Typography variant="h6">Items Added:</Typography>
            <ul>
              {items.map((item, index) => (
                <li key={index}>
                  <strong>{item.itemType}</strong> - {item.itemDescription} -{" "}
                  {item.sizeOrSource} - {item.quantity} - {item.serialNumber}
                </li>
              ))}
            </ul>
            <TextField
              label="Delivery Number"
              value={deliveryNumber}
              onChange={(e) => setDeliveryNumber(e.target.value)}
              fullWidth
              style={{ marginTop: "20px" }}
            />
          </div>
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

export default AddItem;
