import React, { createElement, PropsWithChildren, useState } from 'react';
import { DirectionRouteExtended } from './Directions'; // Adjust the import path as necessary
import { addLineBreakIfLargerThanMaxLength, formatSecondsToHoursMinutes } from './Utils';

const logNode = "Google Maps Route Planner (React) widget: AlternativeRouteTable: ";

interface tableProps {
    route: DirectionRouteExtended[];
    setRouteIndex: any

}
const AlternativeRouteTable: React.FC<PropsWithChildren<tableProps>> = (props) => {
  console.debug(logNode + "component props: ", props); 
    

  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);

  const tableCellClassName = "gm-route-planner-alternative-route-table-cell";

  const hasAlternativeRoutes = props.route.length > 1;
    
    return (
      hasAlternativeRoutes ?
    <table>
      <thead>
        <tr>
          <th className={tableCellClassName}><h6>Option</h6></th>
          <th className={tableCellClassName}><h6>Duration</h6></th>
          <th className={tableCellClassName}><h6>Distance (km.)</h6></th>
        </tr>
      </thead>
      <tbody>
        {props.route.map((route: any, index: number) => (
          <tr key={index}>
            <td className={tableCellClassName}>
              <button
                className={`btn mx-button ${selectedIndex === index ? 'btn-primary' : 'btn-default'}`}
                onClick={() => {
                  props.setRouteIndex(index);
                  setSelectedIndex(index);
                }}
              >
                {route.summary ? (index + 1) + ": " + addLineBreakIfLargerThanMaxLength(route.summary,20) : "Option " + (index + 1)}
              </button>
            </td>
            <td className={tableCellClassName}><h5>{formatSecondsToHoursMinutes(route.duration)}</h5></td>
            <td className={tableCellClassName}><h5>{route.distance / 1000}</h5></td>
          </tr>
        ))}
      </tbody>
    </table> : <div><h5>No alternative route found</h5></div>
  );
};

export default AlternativeRouteTable;