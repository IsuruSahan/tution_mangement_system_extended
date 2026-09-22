import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';

/**
 * A reusable card that shows a total and a grade-wise breakdown.
 * props:
 * - title: The main title (e.g., "Total Active Students")
 * - total: The big number to show (e.g., 25)
 * - data: The array from the API (e.g., [{ _id: "Grade 6", count: 10 }, ...])
 * - variant: The card color (e.g., 'primary', 'success', 'warning')
 */
function GradeStatCard({ title, total, data, variant = 'primary' }) {
    return (
        // h-100 makes all cards in a row the same height
        <Card bg={variant} text={variant === 'warning' ? 'dark' : 'white'} className="h-100">
            <Card.Body>
                <Card.Title as="h2">{total}</Card.Title>
                <Card.Text>{title}</Card.Text>
            </Card.Body>
            {/* Only show the list if there is data */}
            {data && data.length > 0 && (
                <ListGroup variant="flush">
                    {data.map(item => (
                        <ListGroup.Item 
                            key={item._id} 
                            className="d-flex justify-content-between align-items-center"
                        >
                            {item._id || 'N/A'} {/* Show grade or "N/A" */}
                            <span className="badge bg-secondary rounded-pill">
                                {item.count}
                            </span>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </Card>
    );
}

export default GradeStatCard;