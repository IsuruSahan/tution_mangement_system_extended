import React, { useState, useEffect } from 'react'; // Added useEffect
import axios from 'axios';
import { Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';

function AddStudent({ onStudentAdded }) {
    // --- Form Fields ---
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('Grade 6');
    const [location, setLocation] = useState(''); // Default is empty until locations load
    const [contactPhone, setContactPhone] = useState('');
    const [parentName, setParentName] = useState('');

    // --- State for Locations Dropdown ---
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);

    // --- State for messages/errors ---
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // --- Fetch locations when component loads (Uses Environment Variable) ---
    useEffect(() => {
        const fetchLocations = async () => {
             setLocationLoading(true); // Start loading
             setError(''); // Clear previous errors
            try {
                // Get API URL from environment
                const apiUrl = process.env.REACT_APP_API_URL;
                if (!apiUrl) {
                    throw new Error("API URL is not configured. Check Vercel environment variables or local .env file.");
                }

                // Use apiUrl in the request
                const res = await axios.get(`${apiUrl}/api/locations`);
                setLocations(res.data);

                // Set the default location state AFTER locations are loaded
                if (res.data.length > 0) {
                    setLocation(res.data[0].name); // Default to first location
                } else {
                    setLocation(''); // Set to empty if no locations exist
                }

            } catch (err) {
                console.error("Failed to fetch locations:", err);
                // Set a user-friendly error message
                setError(`Failed to load locations list: ${err.message}`);
            } finally {
                setLocationLoading(false); // Stop loading regardless of success/fail
            }
        };
        fetchLocations();
        // We only want this to run once on mount, so the dependency array is empty.
        // Location state is handled internally after fetch.
    }, []); // Empty array means runs once on mount

    // --- Handle Form Submit (Uses Environment Variable) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        setError(''); // Clear previous errors

        if (!name || !grade || !location) {
            return setError('Name, Grade, and Location are required.');
        }

        const newStudent = { name, grade, location, contactPhone, parentName };

        try {
            // Get API URL from environment
            const apiUrl = process.env.REACT_APP_API_URL;
            if (!apiUrl) {
                throw new Error("API URL is not configured.");
            }

            // Use apiUrl in the request
            const response = await axios.post(`${apiUrl}/api/students`, newStudent);

            setMessage(`Success! Student "${response.data.name}" (${response.data.studentId}) added.`); // Show ID on success

            // Clear the form fields after successful submission
            setName('');
            setGrade('Grade 6');
            // Reset location to the first in the list, or empty if no locations
            setLocation(locations.length > 0 ? locations[0].name : '');
            setContactPhone('');
            setParentName('');

            // Notify the parent component (if prop is provided)
            if (onStudentAdded) {
                onStudentAdded();
            }

        } catch (err) {
             console.error("Error adding student:", err);
             // Show backend validation error or generic error
             setError(`Error adding student: ${err.response?.data?.message || err.message}`);
        }
    };

    // --- Render JSX ---
    return (
        <Card className="mb-4">
            <Card.Body>
                <Card.Title>Add New Student</Card.Title>

                {/* Show success or error messages */}
                {message && <Alert variant="success">{message}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="formStudentName">
                                <Form.Label>Student Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="formGrade">
                                <Form.Label>Grade</Form.Label>
                                <Form.Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                                    <option value="Grade 6">Grade 6</option>
                                    <option value="Grade 7">Grade 7</option>
                                    <option value="Grade 8">Grade 8</option>
                                    <option value="Grade 9">Grade 9</option>
                                    <option value="Grade 10">Grade 10</option>
                                    <option value="Grade 11">Grade 11</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="formLocation">
                                <Form.Label>Location</Form.Label>
                                <Form.Select
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    disabled={locationLoading}
                                    required // Make location required
                                >
                                    {/* Handle loading and empty states */}
                                    {locationLoading ? (
                                        <option>Loading locations...</option>
                                    ) : (
                                        locations.length > 0 ? (
                                            // Add a default prompt option if needed, or rely on initial state
                                             <>
                                                 <option value="">-- Select Location --</option>
                                                 {locations.map(loc => (
                                                     <option key={loc._id} value={loc.name}>
                                                         {loc.name}
                                                     </option>
                                                 ))}
                                             </>
                                        ) : (
                                            <option value="">No locations configured</option>
                                        )
                                    )}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="formContactPhone">
                                <Form.Label>Contact Phone</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="formParentName">
                                <Form.Label>Parent's Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={parentName}
                                    onChange={(e) => setParentName(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Button variant="primary" type="submit" disabled={locationLoading}>
                        Add Student
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default AddStudent;