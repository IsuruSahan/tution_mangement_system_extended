import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import AddStudent from '../components/AddStudent';
import StudentList from '../components/StudentList';

function StudentsPage() {
    const [refreshKey, setRefreshKey] = useState(0);

    // Rename this function for clarity
    const handleListRefresh = () => {
        setRefreshKey(oldKey => oldKey + 1); // Increment the key
    };

    return (
        <Container className="mt-4">
            {/* Pass the refresh function to AddStudent
            */}
            <AddStudent onStudentAdded={handleListRefresh} />

            {/* --- THIS IS THE FIX ---
              You must pass the refreshKey AND the handleListRefresh function
              to the StudentList component.
            */}
            <StudentList 
                refreshKey={refreshKey} 
                onListRefresh={handleListRefresh} 
            />
        </Container>
    );
}

export default StudentsPage;