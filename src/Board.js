import React from 'react';
import Dragula from 'dragula';
import 'dragula/dist/dragula.css';
import Swimlane from './Swimlane';
import './Board.css';

const STATUSES = ['backlog', 'in-progress', 'complete'];

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    // This is intentionally frontend-only: every existing request starts in Backlog.
    this.state = {
      clients: {
        backlog: this.getClients().map(client => ({ ...client, status: 'backlog' })),
        inProgress: [],
        complete: [],
      },
    };
    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    };
    this.dragula = null;
  }

  componentDidMount() {
    const containers = [
      this.swimlanes.backlog.current,
      this.swimlanes.inProgress.current,
      this.swimlanes.complete.current,
    ].filter(Boolean);

    this.dragula = Dragula(containers, {
      moves: (el, source, handle) => !handle.closest('.Swimlane-title'),
      accepts: (el, target) => containers.indexOf(target) !== -1,
      revertOnSpill: true,
    });

    this.dragula.on('drop', (el, target, source) => {
      if (!el || !target || !source) return;
      const id = el.getAttribute('data-id');
      const targetStatus = this.statusForContainer(target);
      const sourceStatus = this.statusForContainer(source);
      if (!id || !targetStatus || !sourceStatus) return;

      // Dragula updates the DOM; mirror the move into React state so renders
      // preserve both lane membership and card order.
      this.setState(previousState => {
        const nextClients = {
          backlog: previousState.clients.backlog.slice(),
          inProgress: previousState.clients.inProgress.slice(),
          complete: previousState.clients.complete.slice(),
        };
        const keys = { backlog: 'backlog', 'in-progress': 'inProgress', complete: 'complete' };
        const sourceKey = keys[sourceStatus];
        const targetKey = keys[targetStatus];
        const sourceIndex = nextClients[sourceKey].findIndex(client => String(client.id) === String(id));
        if (sourceIndex === -1) return null;

        const movedClient = { ...nextClients[sourceKey][sourceIndex], status: targetStatus };
        nextClients[sourceKey].splice(sourceIndex, 1);

        // Use the actual dropped DOM position to retain Dragula's ordering.
        const targetIds = Array.from(target.children)
          .map(card => card.getAttribute('data-id'))
          .filter(cardId => cardId && cardId !== String(id));
        const targetOrder = targetIds.indexOf(String(id));
        const insertAt = Math.max(0, Math.min(targetOrder === -1
          ? target.children.length - 1
          : targetOrder, nextClients[targetKey].length));
        nextClients[targetKey].splice(insertAt, 0, movedClient);

        // Reconcile target lane order with the DOM after Dragula completes.
        const domOrder = Array.from(target.children).map(card => card.getAttribute('data-id'));
        nextClients[targetKey].sort((a, b) => domOrder.indexOf(String(a.id)) - domOrder.indexOf(String(b.id)));
        return { clients: nextClients };
      });
    });

    this.dragula.on('cancel', () => {
      // No state update is necessary when Dragula cancels a drag.
    });
  }

  componentWillUnmount() {
    if (this.dragula) {
      this.dragula.destroy();
      this.dragula = null;
    }
  }

  statusForContainer(container) {
    if (container === this.swimlanes.backlog.current) return 'backlog';
    if (container === this.swimlanes.inProgress.current) return 'in-progress';
    if (container === this.swimlanes.complete.current) return 'complete';
    return null;
  }

  getClients() {
    return [
      ['1','Stark, White and Abbott','Cloned Optimal Architecture'],
      ['2','Wiza LLC','Exclusive Bandwidth-Monitored Implementation'],
      ['3','Nolan LLC','Vision-Oriented 4Thgeneration Graphicaluserinterface'],
      ['4','Thompson PLC','Streamlined Regional Knowledgeuser'],
      ['5','Walker-Williamson','Team-Oriented 6Thgeneration Matrix'],
      ['6','Boehm and Sons','Automated Systematic Paradigm'],
      ['7','Runolfsson, Hegmann and Block','Integrated Transitional Strategy'],
      ['8','Schumm-Labadie','Operative Heuristic Challenge'],
      ['9','Kohler Group','Re-Contextualized Multi-Tasking Attitude'],
      ['10','Romaguera Inc','Managed Foreground Toolset'],
      ['11','Reilly-King','Future-Proofed Interactive Toolset'],
      ['12','Emard, Champlin and Runolfsdottir','Devolved Needs-Based Capability'],
      ['13','Fritsch, Cronin and Wolff','Open-Source 3Rdgeneration Website'],
      ['14','Borer LLC','Profit-Focused Incremental Orchestration'],
      ['15','Emmerich-Ankunding','User-Centric Stable Extranet'],
      ['16','Willms-Abbott','Progressive Bandwidth-Monitored Access'],
      ['17','Brekke PLC','Intuitive User-Facing Customerloyalty'],
      ['18','Bins, Toy and Klocko','Integrated Assymetric Software'],
      ['19','Hodkiewicz-Hayes','Programmable Systematic Securedline'],
      ['20','Murphy, Lang and Ferry','Organized Explicit Access'],
    ].map(companyDetails => ({
      id: companyDetails[0],
      name: companyDetails[1],
      description: companyDetails[2],
      status: 'backlog',
    }));
  }

  renderSwimlane(name, clients, ref) {
    return <Swimlane name={name} clients={clients} dragulaRef={ref} />;
  }

  render() {
    return (
      <div className="Board">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-4">
              {this.renderSwimlane('Backlog', this.state.clients.backlog, this.swimlanes.backlog)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('In Progress', this.state.clients.inProgress, this.swimlanes.inProgress)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('Complete', this.state.clients.complete, this.swimlanes.complete)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
