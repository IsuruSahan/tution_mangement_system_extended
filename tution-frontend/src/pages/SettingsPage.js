import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, ListGroup, Spinner, Alert, CloseButton, InputGroup } from 'react-bootstrap';

function SettingsPage() {
    // --- State for Locations ---
    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [newLocationName, setNewLocationName] = useState('');
    const [newLocationCharge, setNewLocationCharge] = useState(0); // NEW
    const [formError, setFormError] = useState('');

    // --- NEW: State for Editing Locations ---
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editCharge, setEditCharge] = useState(0);

    // --- State for Finance Reset (Existing) ---
    const [resettingFinance, setResettingFinance] = useState(false);
    const [resetFinanceMessage, setResetFinanceMessage] = useState('');
    const [resetFinanceError, setResetFinanceError] = useState('');

    // --- State for Attendance Reset (Existing) ---
    const [resettingAttendance, setResettingAttendance] = useState(false);
    const [resetAttendanceMessage, setResetAttendanceMessage] = useState('');
    const [resetAttendanceError, setResetAttendanceError] = useState('');

    // --- State for Student Reset (Existing) ---
    const [resettingStudents, setResettingStudents] = useState(false);
    const [resetStudentsMessage, setResetStudentsMessage] = useState('');
    const [resetStudentsError, setResetStudentsError] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchLocations = async () => {
        setLoadingLocations(true);
        setLocationError('');
        try {
            if (!apiUrl) throw new Error("API URL is not configured.");
            const response = await axios.get(`${apiUrl}/api/locations`);
            setLocations(response.data);
        } catch (err) {
            console.error("Failed to fetch locations:", err);
            setLocationError(`Could not load locations: ${err.message}`);
        } finally {
            setLoadingLocations(false);
        }
    };

    useEffect(() => {
        if(apiUrl) {
            fetchLocations();
        } else {
            setLocationError("API URL is not configured. Check Vercel/local .env file.");
            setLoadingLocations(false);
        }
    }, [apiUrl]);

    // --- Handle adding a location (Updated) ---
    const handleAddLocation = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!newLocationName) { setFormError('Location name cannot be empty.'); return; }
        try {
            const response = await axios.post(`${apiUrl}/api/locations`, { 
                name: newLocationName,
                chargePercentage: newLocationCharge 
            });
            setLocations([...locations, response.data]);
            setNewLocationName('');
            setNewLocationCharge(0);
        } catch (err) {
             setFormError(`Error adding location: ${err.response?.data?.message || err.message}`);
         }
    };

    // --- NEW: Handle updating a location (One-by-One) ---
    const handleUpdateLocation = async (id) => {
        try {
            const response = await axios.put(`${apiUrl}/api/locations/${id}`, {
                name: editName,
                chargePercentage: editCharge
            });
            setLocations(locations.map(loc => loc._id === id ? response.data : loc));
            setEditingId(null); // Exit edit mode
        } catch (err) {
            alert(`Error updating location: ${err.message}`);
        }
    };

    const startEditing = (loc) => {
        setEditingId(loc._id);
        setEditName(loc.name);
        setEditCharge(loc.chargePercentage || 0);
    };

    // --- Handle deleting a location (Existing) ---
    const handleDeleteLocation = async (id) => {
        if (window.confirm('Are you sure you want to delete this location?')) {
            try {
                await axios.delete(`${apiUrl}/api/locations/${id}`);
                setLocations(locations.filter(loc => loc._id !== id));
            } catch (err) {
                 alert(`Error deleting location: ${err.response?.data?.message || err.message}`);
             }
        }
    };

    // --- Reset Handlers (Existing logic preserved) ---
    const handleResetFinance = async () => {
        setResetFinanceMessage(''); setResetFinanceError('');
        if (window.confirm('🚨 DANGER! Are you ABSOLUTELY SURE...?') && window.confirm('🚨 FINAL WARNING!')) {
            setResettingFinance(true);
            try {
                const response = await axios.delete(`${apiUrl}/api/payments/reset`);
                setResetFinanceMessage(response.data.message || 'Finance data reset successfully.');
            } catch (err) {
                setResetFinanceError(`Failed: ${err.message}`);
            } finally { setResettingFinance(false); }
        }
    };

    const handleResetAttendance = async () => {
        setResetAttendanceMessage(''); setResetAttendanceError('');
        if (window.confirm('🚨 DANGER! Are you ABSOLUTELY SURE...?') && window.confirm('🚨 FINAL WARNING!')) {
            setResettingAttendance(true);
            try {
                const response = await axios.delete(`${apiUrl}/api/attendance/reset`);
                setResetAttendanceMessage(response.data.message || 'Attendance data reset successfully.');
            } catch (err) {
                setResetAttendanceError(`Failed: ${err.message}`);
            } finally { setResettingAttendance(false); }
        }
    };

    const handleResetStudents = async () => {
        setResetStudentsMessage(''); setResetStudentsError('');
        if (window.confirm('🚨 DANGER! Are you ABSOLUTELY SURE...?') && window.confirm('🚨 FINAL WARNING!')) {
            setResettingStudents(true);
            try {
                const response = await axios.delete(`${apiUrl}/api/students/reset`);
                setResetStudentsMessage(response.data.message || 'All students deactivated.');
            } catch (err) {
                setResetStudentsError(`Failed: ${err.message}`);
            } finally { setResettingStudents(false); }
        }
    };

    return (
        <Container className="mt-4">
            <Row>
                <Col md={12} lg={7} className="mb-4">
                    <Card className="shadow-sm">
                        <Card.Header className="bg-primary text-white">
                            <Card.Title as="h2" className="mb-0 fs-4">Manage Locations & Charges</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <h5 className="mb-3">Add New Location</h5>
                            {formError && <Alert variant="danger">{formError}</Alert>}
                            <Form onSubmit={handleAddLocation} className="mb-4">
                                <Row className="g-2">
                                    <Col md={7}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Location Name (e.g. Nugegoda)"
                                            value={newLocationName}
                                            onChange={(e) => setNewLocationName(e.target.value)}
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <InputGroup>
                                            <Form.Control
                                                type="number"
                                                placeholder="Charge"
                                                value={newLocationCharge}
                                                onChange={(e) => setNewLocationCharge(e.target.value)}
                                            />
                                            <InputGroup.Text>%</InputGroup.Text>
                                        </InputGroup>
                                    </Col>
                                    <Col md={2}>
                                        <Button type="submit" className="w-100" disabled={loadingLocations}>Add</Button>
                                    </Col>
                                </Row>
                            </Form>
                            <hr />
                            <h5 className="mb-3">Current Locations</h5>
                            {loadingLocations && <Spinner animation="border" size="sm" />}
                            {locationError && <Alert variant="danger">{locationError}</Alert>}
                            <ListGroup variant="flush">
                                {!loadingLocations && locations.map(loc => (
                                    <ListGroup.Item key={loc._id} className="py-3">
                                        {editingId === loc._id ? (
                                            /* Inline Edit Mode */
                                            <Row className="g-2 align-items-center">
                                                <Col md={6}>
                                                    <Form.Control 
                                                        size="sm"
                                                        value={editName} 
                                                        onChange={(e) => setEditName(e.target.value)} 
                                                    />
                                                </Col>
                                                <Col md={3}>
                                                    <InputGroup size="sm">
                                                        <Form.Control 
                                                            type="number" 
                                                            value={editCharge} 
                                                            onChange={(e) => setEditCharge(e.target.value)} 
                                                        />
                                                        <InputGroup.Text>%</InputGroup.Text>
                                                    </InputGroup>
                                                </Col>
                                                <Col md={3} className="text-end">
                                                    <Button size="sm" variant="success" className="me-1" onClick={() => handleUpdateLocation(loc._id)}>Save</Button>
                                                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>X</Button>
                                                </Col>
                                            </Row>
                                        ) : (
                                            /* Normal View Mode */
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <span className="fw-bold">{loc.name}</span>
                                                    <span className="ms-2 badge bg-info text-dark">{loc.chargePercentage || 0}% Hall Fee</span>
                                                </div>
                                                <div>
                                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => startEditing(loc)}>Edit</Button>
                                                    <CloseButton onClick={() => handleDeleteLocation(loc._id)} />
                                                </div>
                                            </div>
                                        )}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                {/* --- Danger Zone --- */}
                <Col md={12} lg={5}>
                    <h2 className="mb-3 text-danger fs-4">⚠️ Danger Zone</h2>
                    <Card border="danger" className="mb-3 shadow-sm">
                        <Card.Body>
                            <h6>Reset Finance Data</h6>
                            {resetFinanceMessage && <Alert variant="success" size="sm">{resetFinanceMessage}</Alert>}
                            <Button size="sm" variant="danger" onClick={handleResetFinance} disabled={resettingFinance}>
                                {resettingFinance ? <Spinner size="sm" /> : 'Delete All Payments'}
                            </Button>
                        </Card.Body>
                    </Card>

                    <Card border="danger" className="mb-3 shadow-sm">
                        <Card.Body>
                            <h6>Reset Attendance Data</h6>
                            {resetAttendanceMessage && <Alert variant="success" size="sm">{resetAttendanceMessage}</Alert>}
                            <Button size="sm" variant="danger" onClick={handleResetAttendance} disabled={resettingAttendance}>
                                {resettingAttendance ? <Spinner size="sm" /> : 'Delete All Attendance'}
                            </Button>
                        </Card.Body>
                    </Card>

                    <Card border="danger" className="mb-3 shadow-sm">
                        <Card.Body>
                            <h6>Deactivate All Students</h6>
                            {resetStudentsMessage && <Alert variant="success" size="sm">{resetStudentsMessage}</Alert>}
                            <Button size="sm" variant="danger" onClick={handleResetStudents} disabled={resettingStudents}>
                                {resettingStudents ? <Spinner size="sm" /> : 'Clear Student List'}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default SettingsPage;